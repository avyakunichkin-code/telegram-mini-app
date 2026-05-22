import json
import logging
import math
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..balance_utils import adjust_balance, adjust_safety_fund_balance, TRANSACTION_TYPES
from ..character_progression import apply_character_xp
from ..game_rules import (
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
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..models import (
    EventChoice,
    EventDefinition,
    EventInstance,
    EventProfileCounter,
    FinanceAsset,
    FinanceLiability,
    GameProfile,
    InsurancePolicy,
)
from ..timeutil import utc_now_naive
from ..expenses import add_expense_line_from_event
from ..insurance_events import apply_insurance_claim_from_effects, find_policy_for_claim
from ..level_gates import UNLOCK_PERIOD_EVENTS, character_level
from ..event_chains import (
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
from ..event_choice_impacts import build_choice_impacts
from ..mvp11_event_seeds import ensure_mvp11_event_catalog


router = APIRouter(prefix="/api/game/events", tags=["events"])

logger = logging.getLogger(__name__)

EVENTS_UNLOCK_INTRO_KEY = "mq11_events_unlock_intro"
_PERIOD_EVENT_POOL_EXCLUDE_KEYS = frozenset({EVENTS_UNLOCK_INTRO_KEY})
ALLOWED_EFFECT_KEYS = frozenset(
    {
        "cash_delta",
        "safety_delta",
        "xp_delta",
        "monthly_lifestyle_delta",
        "monthly_expense_delta",
        "monthly_burn_delta_pct",
        "expense_line",
        "insurance_claim",
        "enqueue_event",
        "asset_from_template",
        "used_car_action",
        "requires_chain_branch",
    }
)


def _clamp_expense_line_amount(amount: float) -> float:
    from ..game_rules import EVENT_LIFESTYLE_DELTA_ABS_CAP

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


def pending_mandatory_blocking_event_titles(
    db: Session, game_profile_id: int, period_index: int
) -> list[str]:
    """События с mandatory_gate=blocks_period_end, которые нужно закрыть выбором до конца периода."""
    rows = (
        db.query(EventInstance, EventDefinition)
        .join(EventDefinition, EventDefinition.id == EventInstance.definition_id)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == period_index,
            EventInstance.status == "pending",
            EventDefinition.mandatory_gate == MANDATORY_GATE_BLOCKS_PERIOD_END,
        )
        .order_by(EventInstance.id.asc())
        .all()
    )
    return [str(defn.title) for _inst, defn in rows]


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


def _weighted_sample_without_replacement(defs: list[EventDefinition], k: int) -> list[EventDefinition]:
    """Взвешенная случайная выборка без повторов (ключ −ln(U)/weight)."""
    if k <= 0:
        return []
    if len(defs) <= k:
        return list(defs)
    scored = []
    for d in defs:
        w = max(int(getattr(d, "weight", 100) or 100), 1)
        u = max(random.random(), 1e-12)
        scored.append((-math.log(u) / w, d))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [t[1] for t in scored[:k]]


def _def_tier(d: EventDefinition) -> int:
    return max(1, int(getattr(d, "event_tier", 1) or 1))


def _ensure_seed_events(db: Session) -> None:
    """Минимальный набор событий, если БД пуста; затем каталог MVP 1.1."""
    has_any = db.query(EventDefinition).count() > 0
    if not has_any:

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
                {"title": "Сразу в подушку (+5 000 ₽)", "effects": {"safety_delta": 5000}},
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
    """Разовое событие при первом доступе к колоде (уровень ≥ UNLOCK_PERIOD_EVENTS)."""
    if character_level(profile) < UNLOCK_PERIOD_EVENTS:
        return

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

    if character_level(profile) < UNLOCK_PERIOD_EVENTS:
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

    repeat_ok: list[EventDefinition] = []
    for d in defs_all:
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

    L = max(1, int(getattr(profile, "level", 1) or 1))
    base_k = min(EVENTS_PER_PERIOD, len(repeat_ok))

    core = [d for d in repeat_ok if event_tier_in_core_window(_def_tier(d), L)]

    if len(core) >= base_k:
        picked = _weighted_sample_without_replacement(core, base_k)
    else:
        p1 = [d for d in repeat_ok if event_tier_in_fallback_primary(_def_tier(d), L)]
        if not p1:
            logger.error("ensure_period_events: fallback P1 empty profile=%s L=%s", game_profile_id, L)
            p1 = [d for d in repeat_ok if _def_tier(d) == 1]
        if not p1:
            return
        kk = min(base_k, len(p1))
        picked = _weighted_sample_without_replacement(p1, kk)

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


def serialize_instance_rows(db: Session, insts: list[EventInstance], *, profile: GameProfile | None = None) -> list[dict]:
    out = []
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
            xp_delta = effects.get("xp_delta")
            if xp_delta:
                row["xp_delta"] = int(xp_delta)
            if profile is not None:
                row["impacts"] = build_choice_impacts(db, profile, effects)
            choice_rows.append(row)
        out.append({
            "id": inst.id,
            "period_index": inst.period_index,
            "key": definition.key,
            "title": definition.title,
            "description": definition.description,
            "choices": choice_rows,
        })
    return out


@router.get("/pending")
async def get_pending_event(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    _ensure_seed_events(db)

    if character_level(profile) < UNLOCK_PERIOD_EVENTS:
        return {"events": [], "event": None}

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

    events = serialize_instance_rows(db, insts, profile=profile)

    first = events[0] if events else None

    return {
        "events": events,
        "event": first,
    }


@router.post("/{event_id}/choose")
async def choose_event(
    event_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    choice_id = payload.get("choice_id")
    if not choice_id:
        raise HTTPException(status_code=400, detail="choice_id is required")

    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

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
    xp_delta = int(effects.get("xp_delta", 0) or 0)
    monthly_lifestyle_delta = float(effects.get("monthly_lifestyle_delta", 0) or 0) + float(
        effects.get("monthly_expense_delta", 0) or 0
    )
    pct = effects.get("monthly_burn_delta_pct")
    if pct is not None:
        from ..expenses import compute_monthly_burn

        burn_total = float(compute_monthly_burn(db, profile).total)
        monthly_lifestyle_delta += round(burn_total * float(pct), 2)
    expense_line_spec = effects.get("expense_line")
    insurance_claim_spec = effects.get("insurance_claim")
    if insurance_claim_spec is not None and not isinstance(insurance_claim_spec, dict):
        raise HTTPException(status_code=400, detail="insurance_claim must be an object")

    if xp_delta < 0:
        raise HTTPException(status_code=400, detail="xp_delta must be >= 0")

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

    if def_key == "mq11_used_car_deadline":
        chain = get_active_chain(db, profile.id, USED_CAR_CHAIN_KEY)
        if chain:
            complete_chain(db, chain, period_index=int(profile.period_index))

    xp_info = {"xp_gained": 0, "level_up": False, "new_level": None}
    if xp_delta > 0:
        xp_info = apply_character_xp(profile, xp_delta, db)

    inst.status = "selected"
    inst.selected_choice_id = int(choice_id)
    inst.resolved_at = utc_now_naive()
    record_event_profile_selection(db, profile.id, int(inst.definition_id), int(profile.period_index))
    db.commit()

    response = {
        "status": "success",
        "xp_gained": int(xp_info.get("xp_gained", 0) or 0),
        "level_up": bool(xp_info.get("level_up")),
        "new_level": xp_info.get("new_level"),
    }
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

