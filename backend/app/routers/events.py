import json
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..models import EventDefinition, EventChoice, EventInstance
from ..balance_utils import adjust_balance, adjust_safety_fund_balance, TRANSACTION_TYPES


router = APIRouter(prefix="/api/game/events", tags=["events"])


def _ensure_seed_events(db: Session) -> None:
    """Создаём минимальный набор событий для easy (light), если их нет."""
    has_any = db.query(EventDefinition).count() > 0
    if has_any:
        return

    def add_event(key: str, title: str, description: str, choices: list[dict], weight: int = 100):
        ed = EventDefinition(
            key=key,
            mode="light",
            title=title,
            description=description,
            weight=weight,
            is_active=1,
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


def _pick_weighted(defs: list[EventDefinition]) -> EventDefinition:
    total = sum(max(0, int(d.weight or 0)) for d in defs)
    if total <= 0:
        return defs[0]
    r = random.randint(1, total)
    acc = 0
    for d in defs:
        acc += max(0, int(d.weight or 0))
        if r <= acc:
            return d
    return defs[-1]


def ensure_event_for_period(db: Session, game_profile_id: int, period_index: int, mode: str) -> EventInstance | None:
    """Гарантирует, что на период есть 0..1 pending-событие (light: создаём почти всегда)."""
    existing = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == period_index,
            EventInstance.status == "pending",
        )
        .first()
    )
    if existing:
        return existing

    defs = (
        db.query(EventDefinition)
        .filter(EventDefinition.is_active == 1, EventDefinition.mode == mode)
        .all()
    )
    if not defs:
        return None

    # Easy: шанс 70% на событие в периоде.
    if mode == "light":
        if random.random() > 0.7:
            return None

    picked = _pick_weighted(defs)
    inst = EventInstance(
        game_profile_id=game_profile_id,
        period_index=period_index,
        definition_id=picked.id,
        status="pending",
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


@router.get("/pending")
async def get_pending_event(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    _ensure_seed_events(db)

    inst = (
        db.query(EventInstance)
        .filter(EventInstance.game_profile_id == profile.id, EventInstance.status == "pending")
        .order_by(EventInstance.created_at.desc())
        .first()
    )
    if not inst:
        # создаём событие для текущего периода (если по шансам выпало)
        inst = ensure_event_for_period(db, profile.id, profile.period_index, profile.mode)
        if not inst:
            return {"event": None}

    definition = db.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
    if not definition:
        return {"event": None}
    choices = (
        db.query(EventChoice)
        .filter(EventChoice.definition_id == definition.id)
        .order_by(EventChoice.id.asc())
        .all()
    )

    return {
        "event": {
            "id": inst.id,
            "period_index": inst.period_index,
            "key": definition.key,
            "title": definition.title,
            "description": definition.description,
            "choices": [
                {"id": c.id, "title": c.title, "description": c.description}
                for c in choices
            ],
        }
    }


@router.post("/{event_id}/choose")
async def choose_event(event_id: int, payload: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
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

    # Применяем эффекты (MVP: только cash_delta и safety_delta)
    cash_delta = float(effects.get("cash_delta", 0) or 0)
    safety_delta = float(effects.get("safety_delta", 0) or 0)

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
        # safety_delta > 0: переложить из cash в safety; если денег нет — ошибка
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
                amount=safety_delta,  # отрицательное = снятие
                type=TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"],
                description=f"Событие: {choice.title}",
                period_index=profile.period_index,
            )
        db.refresh(profile)

    inst.status = "selected"
    inst.selected_choice_id = int(choice_id)
    inst.resolved_at = datetime.utcnow()
    db.commit()

    return {"status": "success"}

