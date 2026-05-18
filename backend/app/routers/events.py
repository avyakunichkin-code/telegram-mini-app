import json
import logging
import math
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..balance_utils import adjust_balance, adjust_safety_fund_balance, TRANSACTION_TYPES
from ..character_progression import apply_character_xp
from ..game_rules import (
    EventProfileCounterSnapshot,
    clamp_profile_lifestyle_delta,
    event_tier_in_core_window,
    event_tier_in_fallback_primary,
    is_event_definition_eligible,
)
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..models import EventChoice, EventDefinition, EventInstance, EventProfileCounter, GameProfile
from ..mvp11_event_seeds import ensure_mvp11_event_catalog


router = APIRouter(prefix="/api/game/events", tags=["events"])

logger = logging.getLogger(__name__)

EVENTS_PER_PERIOD = 3
ALLOWED_EFFECT_KEYS = frozenset({"cash_delta", "safety_delta", "xp_delta", "monthly_lifestyle_delta"})


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

        def add_event(key: str, title: str, description: str, choices: list[dict], weight: int = 100):
            ed = EventDefinition(
                key=key,
                mode="any",
                title=title,
                description=description,
                weight=weight,
                is_active=1,
                event_tier=1,
                repeat_policy="repeatable",
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
            description="Телефон внезапно перестал включаться. Нужно решить, что делать.",
            weight=120,
            choices=[
                {"title": "Починить (−3 000 ₽)", "effects": {"cash_delta": -3000}},
                {"title": "Купить новый (−12 000 ₽)", "effects": {"cash_delta": -12000}},
                {"title": "Отложить ремонт (0 ₽)", "effects": {"cash_delta": 0}},
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


def ensure_period_events(db: Session, game_profile_id: int, period_index: int, save_kind: str) -> None:
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        return

    total_existing = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == period_index,
        )
        .count()
    )
    if total_existing > 0:
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

    repeat_ok: list[EventDefinition] = []
    for d in defs_all:
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


def serialize_instance_rows(db: Session, insts: list[EventInstance]) -> list[dict]:
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
        out.append({
            "id": inst.id,
            "period_index": inst.period_index,
            "key": definition.key,
            "title": definition.title,
            "description": definition.description,
            "choices": [
                {"id": c.id, "title": c.title, "description": c.description}
                for c in choices
            ],
        })
    return out


@router.get("/pending")
async def get_pending_event(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    _ensure_seed_events(db)

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

    events = serialize_instance_rows(db, insts)

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

    unknown = set(effects.keys()) - ALLOWED_EFFECT_KEYS
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown effect keys: {sorted(unknown)}",
        )

    cash_delta = float(effects.get("cash_delta", 0) or 0)
    safety_delta = float(effects.get("safety_delta", 0) or 0)
    xp_delta = int(effects.get("xp_delta", 0) or 0)
    monthly_lifestyle_delta = float(effects.get("monthly_lifestyle_delta", 0) or 0)

    if xp_delta < 0:
        raise HTTPException(status_code=400, detail="xp_delta must be >= 0")

    if cash_delta < 0 and float(profile.cash_balance) < (-cash_delta) - 1e-6:
        raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для этого выбора")

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

    xp_info = {"xp_gained": 0, "level_up": False, "new_level": None}
    if xp_delta > 0:
        xp_info = apply_character_xp(profile, xp_delta, db)

    inst.status = "selected"
    inst.selected_choice_id = int(choice_id)
    inst.resolved_at = datetime.utcnow()
    record_event_profile_selection(db, profile.id, int(inst.definition_id), int(profile.period_index))
    db.commit()

    return {
        "status": "success",
        "xp_gained": int(xp_info.get("xp_gained", 0) or 0),
        "level_up": bool(xp_info.get("level_up")),
        "new_level": xp_info.get("new_level"),
    }

