"""События: пул периода, pending payload, выбор."""
import json
import logging
import math
import random

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ...finance.balance_utils import adjust_balance, adjust_safety_fund_balance, TRANSACTION_TYPES
from ...game.rules import (
    EVENTS_PER_PERIOD,
    MANDATORY_GATE_BLOCKS_PERIOD_END,
    EventProfileContext,
    EventProfileCounterSnapshot,
    clamp_profile_lifestyle_delta,
    event_prerequisites_met,
    event_tier_in_core_window,
    event_tier_in_fallback_primary,
    is_event_definition_eligible,
    parse_event_prerequisites_json,
)
from ...models import (
    EventChoice,
    EventDefinition,
    EventInstance,
    EventProfileCounter,
    FinanceAsset,
    FinanceLiability,
    GameProfile,
    GameStarterTemplate,
    InsurancePolicy,
)
from ...timeutil import utc_now_naive
from ...finance.expenses import add_expense_line_from_event
from ...events.insurance_hooks import apply_insurance_claim_from_effects, find_policy_for_claim
from ...events.chains import (
    CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL,
    USED_CAR_CHAIN_KEY,
    apply_asset_from_template_effect,
    apply_enqueue_event_effect,
    choice_allowed_for_chain_branch,
    complete_chain,
    ensure_scheduled_chain_events,
    get_active_chain,
    resolve_choice_effects_for_definition,
)
from ...events.choice_impacts import build_choice_impacts
from ...events.taxonomy import (
    audience_matches,
    effective_event_weight,
    event_domain,
    event_slot,
    parse_event_metadata,
)
from ...events.mvp11_seeds import ensure_mvp11_event_catalog
from ...needs.engine import AXES as NEEDS_AXES, apply_needs_delta, needs_values_from_profile, parse_needs_config, parse_needs_delta



from ...events.constants import (
    ALLOWED_EFFECT_KEYS,
    EVENTS_UNLOCK_INTRO_KEY,
    PERIOD_EVENT_POOL_EXCLUDE_KEYS,
)

logger = logging.getLogger(__name__)

_PERIOD_EVENT_POOL_EXCLUDE_KEYS = PERIOD_EVENT_POOL_EXCLUDE_KEYS


def _needs_config_for_profile(db: Session, profile: GameProfile) -> dict | None:
    if str(getattr(profile, "save_kind", "game") or "game") != "game":
        return None
    tk = str(getattr(profile, "starter_template_key", "") or "").strip()
    if not tk:
        return None
    tmpl = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == tk)
        .first()
    )
    if not tmpl:
        return None
    try:
        blueprint = json.loads(tmpl.blueprint_json or "{}")
    except json.JSONDecodeError:
        blueprint = {}
    return parse_needs_config(blueprint)


NEEDS_AXIS_LABELS: dict[str, str] = {
    "comfort": "Комфорт",
    "status": "Статус",
    "social": "Связи",
    "health": "Здоровье",
}


def _needs_rescue_min_axis(needs_cfg: dict | None, profile: GameProfile) -> str | None:
    """Ось с минимальным значением, если игрок в зоне rescue (distressed или 0); иначе None."""
    if not needs_cfg:
        return None
    thresholds = needs_cfg.get("thresholds") if isinstance(needs_cfg.get("thresholds"), dict) else {}
    distressed_thr = int(thresholds.get("distressed") or 30)
    before = needs_values_from_profile(profile)
    has_zero = any(float(before.get(k) or 0) <= 0.0 for k in NEEDS_AXES)
    is_distressed = any(
        0.0 < float(before.get(k) or 0) < float(distressed_thr) for k in NEEDS_AXES
    )
    if not (has_zero or is_distressed):
        return None
    return min(NEEDS_AXES, key=lambda k: float(before.get(k) or 0))


def _event_rescue_matches_min_axis(defn: EventDefinition, min_axis: str) -> bool:
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    if meta.get("is_rescue") is not True:
        return False
    rescue_axes = meta.get("rescue_axes")
    if isinstance(rescue_axes, list) and rescue_axes:
        return min_axis in {str(x) for x in rescue_axes}
    return True


def _rescue_weight_multiplier(
    defn: EventDefinition,
    *,
    needs_cfg: dict | None,
    profile: GameProfile,
) -> float:
    """
    Если needs просели, усиливаем rescue-события (content) через rescue_event_bias.
    Rescue-событие помечаем в metadata_json: {"is_rescue": true, "rescue_axes": ["social", ...]}.
    """
    min_axis = _needs_rescue_min_axis(needs_cfg, profile)
    if not min_axis or not _event_rescue_matches_min_axis(defn, min_axis):
        return 1.0
    before = needs_values_from_profile(profile)
    has_zero = any(float(before.get(k) or 0) <= 0.0 for k in NEEDS_AXES)
    bias = float(needs_cfg.get("player_support", {}).get("rescue_event_bias") or 1.0)
    severity = 2.0 if has_zero else 1.5
    return max(1.0, bias * severity)


def _order_events_recommended_first(events: list[dict]) -> list[dict]:
    """Рекомендуемые (по min-оси) — в начале списка, остальные — в исходном порядке."""
    indexed = list(enumerate(events))
    indexed.sort(key=lambda t: (0 if t[1].get("recommended") else 1, t[0]))
    return [e for _, e in indexed]


def _clamp_expense_line_amount(amount: float) -> float:
    from ...game.rules import EVENT_LIFESTYLE_DELTA_ABS_CAP

    cap = float(EVENT_LIFESTYLE_DELTA_ABS_CAP)
    return max(-cap, min(cap, float(amount)))


def _apply_expense_line_effect(db: Session, profile: GameProfile, raw: object, *, source_ref: str) -> None:
    if not isinstance(raw, dict):
        raise HTTPException(status_code=400, detail="expense_line must be an object")
    category_key = str(raw.get("category_key") or "other").strip() or "other"
    amount = _clamp_expense_line_amount(float(raw.get("amount_monthly", raw.get("amount", 0)) or 0))
    if amount == 0:
        return
    title = raw.get("title")
    expires = raw.get("expires_after_periods")
    if expires is not None:
        expires = int(expires)
    add_expense_line_from_event(
        db,
        profile,
        category_key=category_key,
        amount_monthly=amount,
        title=str(title).strip() if title else None,
        expires_after_periods=expires,
        source_ref=source_ref,
    )


def expire_pending_events_for_closed_period(db: Session, game_profile_id: int, closed_period_index: int) -> int:
    """Все pending-инстансы закрываемого периода → expired (SPEC MVP 1.1)."""
    updated = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == closed_period_index,
            EventInstance.status == "pending",
        )
        .update({"status": "expired"}, synchronize_session=False)
    )
    return int(updated or 0)


def _weighted_sample_without_replacement(
    defs: list[EventDefinition],
    k: int,
    *,
    counter_map: dict[int, EventProfileCounterSnapshot] | None = None,
    weight_multiplier_by_id: dict[int, float] | None = None,
) -> list[EventDefinition]:
    """Взвешенная случайная выборка без повторов (ключ −ln(U)/weight)."""
    if k <= 0:
        return []
    if len(defs) <= k:
        return list(defs)
    scored = []
    for d in defs:
        if counter_map is not None:
            w = effective_event_weight(d, counter_map.get(int(d.id)))
        else:
            w = max(int(getattr(d, "weight", 100) or 100), 1)
        if weight_multiplier_by_id is not None:
            mult = float(weight_multiplier_by_id.get(int(d.id), 1.0) or 1.0)
            if mult > 1.0:
                w = max(1, int(round(float(w) * mult)))
        u = max(random.random(), 1e-12)
        scored.append((-math.log(u) / w, d))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [t[1] for t in scored[:k]]


def _pick_diverse_period_events(
    candidates: list[EventDefinition],
    k: int,
    counter_map: dict[int, EventProfileCounterSnapshot],
    *,
    weight_multiplier_by_id: dict[int, float] | None = None,
) -> list[EventDefinition]:
    """До k событий с разными event_domain, если кандидатов хватает."""
    picked: list[EventDefinition] = []
    remaining = list(candidates)
    for _ in range(k):
        if not remaining:
            break
        if picked:
            used_domains = {event_domain(d) for d in picked}
            pool = [d for d in remaining if event_domain(d) not in used_domains]
            if not pool:
                pool = remaining
        else:
            pool = remaining
        batch = _weighted_sample_without_replacement(
            pool,
            1,
            counter_map=counter_map,
            weight_multiplier_by_id=weight_multiplier_by_id,
        )
        if not batch:
            break
        choice = batch[0]
        picked.append(choice)
        remaining = [d for d in remaining if d.id != choice.id]
    return picked


def _def_tier(d: EventDefinition) -> int:
    return max(1, int(getattr(d, "event_tier", 1) or 1))


def _ensure_seed_events(db: Session) -> None:
    """Минимальный набор событий, если БД пуста; затем каталог MVP 1.1."""
    if db.query(EventDefinition.id).limit(1).first() is not None:
        ensure_mvp11_event_catalog(db)
        return

    def add_event(
        key: str,
        title: str,
        description: str,
        choices: list[dict],
        weight: int = 100,
        *,
        mandatory_gate: str = "none",
    ):
        ed = EventDefinition(
            key=key,
            mode="any",
            title=title,
            description=description,
            weight=weight,
            is_active=1,
            event_tier=1,
            repeat_policy="repeatable",
            mandatory_gate=mandatory_gate,
        )
        db.add(ed)
        db.flush()
        for ch in choices:
            db.add(
                EventChoice(
                    definition_id=ed.id,
                    title=ch["title"],
                    description=ch.get("description", ""),
                    effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
                )
            )

    add_event(
        key="broken_phone",
        title="Сломался телефон",
        description="Телефон не включается — без связи сложно работать и оплачивать счета.",
        weight=120,
        mandatory_gate="blocks_period_end",
        choices=[
            {"title": "Починить в сервисе", "effects": {"cash_delta": -3000, "xp_delta": 2}},
            {"title": "Купить новый", "effects": {"cash_delta": -12000, "xp_delta": 1}},
            {
                "title": "Временный б/у аппарат",
                "effects": {
                    "cash_delta": -4500,
                    "expense_line": {
                        "category_key": "communications",
                        "amount_monthly": 800,
                        "title": "Связь (б/у)",
                        "expires_after_periods": 2,
                    },
                    "xp_delta": 1,
                },
            },
        ],
    )
    add_event(
        key="tax_refund",
        title="Налоговый вычет",
        description="Вам одобрили небольшой налоговый вычет.",
        weight=60,
        choices=[
            {"title": "Забрать на баланс (+5 000 ₽)", "effects": {"cash_delta": 5000}},
            {"title": "Сразу в подушку (+5 000 ₽)", "effects": {"safety_grant": 5000}},
        ],
    )
    add_event(
        key="friend_offer",
        title="Предложение подработки",
        description="Друг предлагает подработку на выходных. Это потребует времени, но даст деньги.",
        weight=90,
        choices=[
            {"title": "Согласиться (+4 000 ₽)", "effects": {"cash_delta": 4000}},
            {"title": "Отказаться (0 ₽)", "effects": {"cash_delta": 0}},
        ],
    )

    db.commit()

    ensure_mvp11_event_catalog(db)


def _load_event_profile_context(db: Session, game_profile_id: int) -> EventProfileContext:
    asset_kinds = {
        str(row.kind).strip()
        for row in db.query(FinanceAsset.kind)
        .filter(
            FinanceAsset.game_profile_id == game_profile_id,
            FinanceAsset.is_active == 1,
        )
        .all()
        if row.kind
    }
    liability_count = int(
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == game_profile_id,
            FinanceLiability.is_active == 1,
        )
        .count()
    )
    ins_keys: set[str] = set()
    for row in (
        db.query(InsurancePolicy.product, InsurancePolicy.insured_object)
        .filter(
            InsurancePolicy.game_profile_id == game_profile_id,
            InsurancePolicy.is_active == 1,
            InsurancePolicy.claimed_period_index.is_(None),
        )
        .all()
    ):
        product = str(row.product or "").strip()
        insured = str(row.insured_object or "").strip()
        if product and insured:
            ins_keys.add(f"{product}:{insured}")
    return EventProfileContext(
        active_asset_kinds=frozenset(asset_kinds),
        active_liability_count=liability_count,
        active_insurance_claim_keys=frozenset(ins_keys),
    )


def _definition_prerequisites_met(d: EventDefinition, ctx: EventProfileContext) -> bool:
    prereq = parse_event_prerequisites_json(getattr(d, "prerequisites_json", None))
    return event_prerequisites_met(prereq, ctx)


def _choice_available_for_profile(db: Session, profile: GameProfile, effects: dict) -> bool:
    claim = effects.get("insurance_claim")
    if not isinstance(claim, dict):
        return True
    kind = (claim.get("kind") or "").strip() or None
    product = (claim.get("product") or "").strip() or None
    insured_object = (claim.get("insured_object") or "").strip() or None
    policy_id = claim.get("policy_id")
    pid = int(policy_id) if policy_id is not None else None
    return (
        find_policy_for_claim(
            db,
            profile.id,
            kind=kind,
            product=product,
            insured_object=insured_object,
            policy_id=pid,
        )
        is not None
    )


def _load_event_counter_map(db: Session, game_profile_id: int) -> dict[int, EventProfileCounterSnapshot]:
    rows = (
        db.query(EventProfileCounter)
        .filter(EventProfileCounter.game_profile_id == game_profile_id)
        .all()
    )
    return {
        int(r.definition_id): EventProfileCounterSnapshot(
            times_selected=int(r.times_selected or 0),
            last_selected_period_index=(
                int(r.last_selected_period_index) if r.last_selected_period_index is not None else None
            ),
        )
        for r in rows
    }


def record_event_profile_selection(
    db: Session, game_profile_id: int, definition_id: int, period_index: int
) -> None:
    row = (
        db.query(EventProfileCounter)
        .filter(
            EventProfileCounter.game_profile_id == game_profile_id,
            EventProfileCounter.definition_id == definition_id,
        )
        .first()
    )
    if row:
        row.times_selected = int(row.times_selected or 0) + 1
        row.last_selected_period_index = int(period_index)
    else:
        db.add(
            EventProfileCounter(
                game_profile_id=game_profile_id,
                definition_id=definition_id,
                times_selected=1,
                last_selected_period_index=int(period_index),
            )
        )


def ensure_events_unlock_intro(db: Session, profile: GameProfile) -> None:
    """Разовое intro-событие при первом доступе к колоде (с 1-го периода)."""
    definition = (
        db.query(EventDefinition)
        .filter(
            EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY,
            EventDefinition.is_active == 1,
        )
        .first()
    )
    if not definition:
        return

    counter = _load_event_counter_map(db, profile.id).get(int(definition.id))
    if not is_event_definition_eligible(
        repeat_policy=getattr(definition, "repeat_policy", None),
        repeat_max=getattr(definition, "repeat_max", None),
        cooldown_periods=int(getattr(definition, "cooldown_periods", 0) or 0),
        current_period_index=int(profile.period_index),
        counter=counter,
    ):
        return

    already = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == profile.id,
            EventInstance.definition_id == definition.id,
        )
        .first()
    )
    if already:
        return

    db.add(
        EventInstance(
            game_profile_id=profile.id,
            period_index=int(profile.period_index),
            definition_id=definition.id,
            status="pending",
        )
    )
    db.commit()


def _period_pool_instance_count(
    db: Session, game_profile_id: int, period_index: int, *, exclude_intro: bool = True
) -> int:
    q = db.query(EventInstance).filter(
        EventInstance.game_profile_id == game_profile_id,
        EventInstance.period_index == period_index,
    )
    exclude_def_ids: list[int] = []
    if exclude_intro:
        intro = (
            db.query(EventDefinition.id)
            .filter(EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY)
            .scalar()
        )
        if intro is not None:
            exclude_def_ids.append(int(intro))
    for key in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL:
        row = db.query(EventDefinition.id).filter(EventDefinition.key == key).scalar()
        if row is not None:
            exclude_def_ids.append(int(row))
    if exclude_def_ids:
        q = q.filter(EventInstance.definition_id.notin_(exclude_def_ids))
    return int(q.count())


def ensure_period_events(db: Session, game_profile_id: int, period_index: int, save_kind: str) -> None:
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        return

    ensure_scheduled_chain_events(db, game_profile_id, period_index)

    if _period_pool_instance_count(db, game_profile_id, period_index) >= EVENTS_PER_PERIOD:
        return

    defs_all = (
        db.query(EventDefinition)
        .filter(
            EventDefinition.is_active == 1,
            or_(EventDefinition.mode == save_kind, EventDefinition.mode == "any"),
        )
        .all()
    )
    if not defs_all:
        logger.warning(
            "ensure_period_events: no definitions for profile=%s save_kind=%s",
            game_profile_id,
            save_kind,
        )
        return

    counter_map = _load_event_counter_map(db, game_profile_id)
    profile_ctx = _load_event_profile_context(db, game_profile_id)
    needs_cfg = _needs_config_for_profile(db, profile)
    rescue_mult_by_id: dict[int, float] | None = None
    if needs_cfg:
        rescue_mult_by_id = {int(d.id): _rescue_weight_multiplier(d, needs_cfg=needs_cfg, profile=profile) for d in defs_all}

    repeat_ok: list[EventDefinition] = []
    for d in defs_all:
        if event_slot(d) != "period_choice":
            continue
        if not audience_matches(d, profile):
            continue
        if d.key in _PERIOD_EVENT_POOL_EXCLUDE_KEYS:
            continue
        if d.key in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL:
            continue
        if not _definition_prerequisites_met(d, profile_ctx):
            continue
        if not is_event_definition_eligible(
            repeat_policy=getattr(d, "repeat_policy", None),
            repeat_max=getattr(d, "repeat_max", None),
            cooldown_periods=int(getattr(d, "cooldown_periods", 0) or 0),
            current_period_index=int(period_index),
            counter=counter_map.get(int(d.id)),
        ):
            continue
        repeat_ok.append(d)

    if not repeat_ok:
        logger.error("ensure_period_events: repeat_ok empty profile=%s", game_profile_id)
        return

    period_idx = max(1, int(period_index))
    base_k = min(EVENTS_PER_PERIOD, len(repeat_ok))

    core = [d for d in repeat_ok if event_tier_in_core_window(_def_tier(d), period_idx)]

    if len(core) >= base_k:
        picked = _pick_diverse_period_events(core, base_k, counter_map, weight_multiplier_by_id=rescue_mult_by_id)
    else:
        p1 = [d for d in repeat_ok if event_tier_in_fallback_primary(_def_tier(d), period_idx)]
        if not p1:
            logger.error(
                "ensure_period_events: fallback P1 empty profile=%s period_index=%s",
                game_profile_id,
                period_idx,
            )
            p1 = [d for d in repeat_ok if _def_tier(d) == 1]
        if not p1:
            return
        kk = min(base_k, len(p1))
        picked = _pick_diverse_period_events(p1, kk, counter_map, weight_multiplier_by_id=rescue_mult_by_id)

    for d in picked:
        db.add(
            EventInstance(
                game_profile_id=game_profile_id,
                period_index=period_index,
                definition_id=d.id,
                status="pending",
            )
        )

    db.commit()


def serialize_instance_rows(
    db: Session,
    insts: list[EventInstance],
    *,
    profile: GameProfile | None = None,
    needs_cfg: dict | None = None,
) -> list[dict]:
    out = []
    min_axis: str | None = None
    if profile is not None and needs_cfg is not None:
        min_axis = _needs_rescue_min_axis(needs_cfg, profile)
    for inst in insts:
        definition = db.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
        if not definition:
            continue
        choices = (
            db.query(EventChoice)
            .filter(EventChoice.definition_id == definition.id)
            .order_by(EventChoice.id.asc())
            .all()
        )
        chain_ctx: dict | None = None
        if profile is not None and definition.key == "mq11_used_car_deadline":
            chain_row = get_active_chain(db, profile.id, USED_CAR_CHAIN_KEY)
            if chain_row:
                chain_ctx = json.loads(chain_row.context_json or "{}")

        choice_rows = []
        for c in choices:
            try:
                effects = json.loads(c.effects_json or "{}")
            except json.JSONDecodeError:
                effects = {}
            if not isinstance(effects, dict):
                effects = {}
            if chain_ctx and not choice_allowed_for_chain_branch(effects, chain_ctx):
                continue
            if profile is not None and not _choice_available_for_profile(db, profile, effects):
                continue
            if profile is not None:
                effects = resolve_choice_effects_for_definition(
                    db, profile, definition.key, effects
                )
            row = {"id": c.id, "title": c.title, "description": c.description}
            if effects.get("insurance_claim"):
                row["insurance_claim"] = True
            if profile is not None:
                row["impacts"] = build_choice_impacts(db, profile, effects)
                if _needs_config_for_profile(db, profile) and effects.get("needs_delta") is not None:
                    try:
                        nd = parse_needs_delta(effects.get("needs_delta"))
                        if any(abs(v) >= 1e-6 for v in nd.values()):
                            row["needs_delta"] = nd
                    except ValueError:
                        pass
            choice_rows.append(row)
        row = {
            "id": inst.id,
            "period_index": inst.period_index,
            "key": definition.key,
            "event_domain": event_domain(definition),
            "title": definition.title,
            "description": definition.description,
            "choices": choice_rows,
        }
        if min_axis and _event_rescue_matches_min_axis(definition, min_axis):
            row["recommended"] = True
            row["recommended_for_need"] = NEEDS_AXIS_LABELS.get(min_axis, min_axis)
            row["recommended_hint"] = (
                f"Рекомендуемое событие — помогает поднять «{row['recommended_for_need']}»"
            )
        out.append(row)
    return out


def build_pending_events_payload(db: Session, profile: GameProfile) -> dict:
    _ensure_seed_events(db)

    ensure_events_unlock_intro(db, profile)
    ensure_period_events(db, profile.id, profile.period_index, profile.save_kind)

    insts = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == profile.id,
            EventInstance.status == "pending",
            EventInstance.period_index == profile.period_index,
        )
        .order_by(EventInstance.id.asc())
        .all()
    )

    needs_cfg = _needs_config_for_profile(db, profile)
    events = serialize_instance_rows(db, insts, profile=profile, needs_cfg=needs_cfg)
    events = _order_events_recommended_first(events)

    first = events[0] if events else None
    min_axis = _needs_rescue_min_axis(needs_cfg, profile) if needs_cfg else None

    payload: dict = {
        "events": events,
        "event": first,
    }
    if min_axis:
        payload["needs_rescue_focus"] = {
            "axis": min_axis,
            "label": NEEDS_AXIS_LABELS.get(min_axis, min_axis),
        }
    return payload

def choose_event(db: Session, profile: GameProfile, event_id: int, choice_id: int) -> dict:


    inst = (
        db.query(EventInstance)
        .filter(
            EventInstance.id == event_id,
            EventInstance.game_profile_id == profile.id,
            EventInstance.status == "pending",
        )
        .first()
    )
    if not inst:
        raise HTTPException(status_code=404, detail="Event not found or already resolved")

    choice = db.query(EventChoice).filter(EventChoice.id == choice_id, EventChoice.definition_id == inst.definition_id).first()
    if not choice:
        raise HTTPException(status_code=404, detail="Choice not found")

    try:
        effects = json.loads(choice.effects_json or "{}")
    except Exception:
        effects = {}

    if not isinstance(effects, dict):
        raise HTTPException(status_code=400, detail="Invalid effects_json shape")

    definition = db.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
    def_key = definition.key if definition else ""

    effects = resolve_choice_effects_for_definition(db, profile, def_key, effects)

    unknown = set(effects.keys()) - ALLOWED_EFFECT_KEYS
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown effect keys: {sorted(unknown)}",
        )

    enqueue_spec = effects.get("enqueue_event")
    if enqueue_spec is not None:
        try:
            apply_enqueue_event_effect(db, profile, enqueue_spec)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e) or "enqueue_event failed") from e

    cash_delta = float(effects.get("cash_delta", 0) or 0)
    safety_delta = float(effects.get("safety_delta", 0) or 0)
    safety_grant = float(effects.get("safety_grant", 0) or 0)
    monthly_lifestyle_delta = float(effects.get("monthly_lifestyle_delta", 0) or 0) + float(
        effects.get("monthly_expense_delta", 0) or 0
    )
    pct = effects.get("monthly_burn_delta_pct")
    if pct is not None:
        from ...finance.expenses import compute_monthly_burn

        burn_total = float(compute_monthly_burn(db, profile).total)
        monthly_lifestyle_delta += round(burn_total * float(pct), 2)
    expense_line_spec = effects.get("expense_line")
    insurance_claim_spec = effects.get("insurance_claim")
    if insurance_claim_spec is not None and not isinstance(insurance_claim_spec, dict):
        raise HTTPException(status_code=400, detail="insurance_claim must be an object")

    if cash_delta < 0 and float(profile.cash_balance) < (-cash_delta) - 1e-6:
        raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для этого выбора")

    insurance_claim_result = None
    if insurance_claim_spec:
        try:
            insurance_claim_result = apply_insurance_claim_from_effects(
                db,
                profile,
                insurance_claim_spec,
                int(profile.period_index),
            )
            db.refresh(profile)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e) or "Страховой случай недоступен") from e

    try:
        if cash_delta != 0:
            adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=cash_delta,
                type="event_cash",
                description=f"Событие: {choice.title}",
                period_index=profile.period_index,
            )
            db.refresh(profile)

        if safety_grant > 0:
            from ...finance.balance_utils import grant_safety_fund_balance

            grant_safety_fund_balance(
                db=db,
                game_profile_id=profile.id,
                amount=safety_grant,
                description=f"Событие (зачисление в подушку): {choice.title}",
                period_index=profile.period_index,
            )
            db.refresh(profile)

        if safety_delta != 0:
            if safety_delta > 0:
                adjust_safety_fund_balance(
                    db=db,
                    game_profile_id=profile.id,
                    amount=safety_delta,
                    type=TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"],
                    description=f"Событие: {choice.title}",
                    period_index=profile.period_index,
                )
            else:
                adjust_safety_fund_balance(
                    db=db,
                    game_profile_id=profile.id,
                    amount=safety_delta,
                    type=TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"],
                    description=f"Событие: {choice.title}",
                    period_index=profile.period_index,
                )
            db.refresh(profile)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e) or "Недостаточно средств") from e

    if monthly_lifestyle_delta != 0:
        profile.delta_monthly_lifestyle_expense = clamp_profile_lifestyle_delta(
            float(getattr(profile, "delta_monthly_lifestyle_expense", 0) or 0),
            monthly_lifestyle_delta,
        )

    if expense_line_spec is not None:
        _apply_expense_line_effect(
            db,
            profile,
            expense_line_spec,
            source_ref=f"event:{inst.definition_id}:choice:{choice_id}",
        )

    asset_spec = effects.get("asset_from_template")
    asset_created = None
    if asset_spec is not None:
        try:
            asset_created = apply_asset_from_template_effect(
                db,
                profile,
                asset_spec,
                period_index=int(profile.period_index),
            )
            db.refresh(profile)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e) or "Покупка актива недоступна") from e

    needs_delta_spec = effects.get("needs_delta")
    needs_before = None
    needs_after = None
    if needs_delta_spec is not None:
        try:
            delta = parse_needs_delta(needs_delta_spec)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e) or "invalid needs_delta") from e
        if any(abs(v) >= 1e-6 for v in delta.values()):
            cfg = _needs_config_for_profile(db, profile)
            if cfg:
                needs_before = needs_values_from_profile(profile)
                needs_after = apply_needs_delta(profile, delta)

    if def_key == "mq11_used_car_deadline":
        chain = get_active_chain(db, profile.id, USED_CAR_CHAIN_KEY)
        if chain:
            complete_chain(db, chain, period_index=int(profile.period_index))

    inst.status = "selected"
    inst.selected_choice_id = int(choice_id)
    inst.resolved_at = utc_now_naive()
    record_event_profile_selection(db, profile.id, int(inst.definition_id), int(profile.period_index))
    db.commit()

    try:
        from ...guidance.engine import on_event_chosen

        on_event_chosen(db, profile.user_id)
    except Exception:
        pass

    try:
        from ...admin.notify import notify_event_chosen

        notify_event_chosen(
            db,
            profile,
            definition=definition,
            choice=choice,
            event_instance=inst,
        )
    except Exception:
        pass

    response = {"status": "success"}
    if needs_after is not None:
        response["needs_before"] = needs_before
        response["needs_after"] = needs_after
    if insurance_claim_result:
        response["insurance_claim"] = insurance_claim_result
    if asset_created:
        response["asset_created"] = {
            "id": int(asset_created.id),
            "title": asset_created.title,
            "kind": asset_created.kind,
            "asset_value": float(asset_created.asset_value),
        }
    return response
