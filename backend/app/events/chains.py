"""
Цепочки событий: enqueue_event, выдача follow-up, контекст сделки (авто и др.).
"""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from ..models import AssetTemplate, EventDefinition, EventInstance, EventProfileChain, FinanceAsset, GameProfile

logger = logging.getLogger(__name__)

CHAIN_STATUS_SCHEDULED = "scheduled"
CHAIN_STATUS_SURFACED = "surfaced"
CHAIN_STATUS_COMPLETED = "completed"
CHAIN_STATUS_CANCELLED = "cancelled"

USED_CAR_CHAIN_KEY = "used_car_deal"
FAMILY_MONEY_CHAIN_KEY = "family_money_refusal"
USED_CAR_TEMPLATE_KEY = "car_personal"
USED_CAR_DEFAULT_DISCOUNT = 0.25
USED_CAR_DEPOSIT_AMOUNT = 50_000.0

CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL = frozenset(
    {
        "mq11_used_car_deadline",
        "mq11_family_money_callback",
    }
)


def _parse_json_obj(raw: str | None) -> dict[str, Any]:
    if not raw or not str(raw).strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def resolve_car_deal_prices(
    db: Session, *, template_key: str, discount_rate: float
) -> tuple[float, float]:
    tpl = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.template_key == template_key, AssetTemplate.is_active == 1)
        .first()
    )
    if not tpl:
        raise ValueError(f"Шаблон актива не найден: {template_key}")
    list_price = float(tpl.asset_value)
    rate = max(0.0, min(0.5, float(discount_rate)))
    deal_price = round(list_price * (1.0 - rate), 2)
    return list_price, deal_price


def enrich_used_car_context(db: Session, ctx: dict[str, Any]) -> dict[str, Any]:
    template_key = str(ctx.get("template_key") or USED_CAR_TEMPLATE_KEY).strip()
    discount_rate = float(ctx.get("discount_rate", USED_CAR_DEFAULT_DISCOUNT))
    list_price, deal_price = resolve_car_deal_prices(db, template_key=template_key, discount_rate=discount_rate)
    deposit = max(0.0, float(ctx.get("deposit_amount", 0) or 0))
    branch = str(ctx.get("branch") or "thinking").strip()
    return {
        **ctx,
        "template_key": template_key,
        "discount_rate": discount_rate,
        "list_price": list_price,
        "deal_price": deal_price,
        "deposit_amount": deposit,
        "branch": branch,
        "remaining_cash_due": round(max(0.0, deal_price - deposit), 2),
    }


def get_active_chain(
    db: Session, game_profile_id: int, chain_key: str, *, statuses: tuple[str, ...] | None = None
) -> EventProfileChain | None:
    st = statuses or (CHAIN_STATUS_SCHEDULED, CHAIN_STATUS_SURFACED)
    return (
        db.query(EventProfileChain)
        .filter(
            EventProfileChain.game_profile_id == game_profile_id,
            EventProfileChain.chain_key == chain_key,
            EventProfileChain.status.in_(st),
        )
        .order_by(EventProfileChain.id.desc())
        .first()
    )


def schedule_event_chain(
    db: Session,
    profile: GameProfile,
    *,
    chain_key: str,
    followup_definition_key: str,
    after_periods: int,
    context: dict[str, Any],
) -> EventProfileChain:
    after = max(1, int(after_periods))
    period_index = int(profile.period_index)
    due = period_index + after

    existing = get_active_chain(db, profile.id, chain_key)
    if existing:
        existing.status = CHAIN_STATUS_CANCELLED
        existing.completed_period_index = period_index

    ctx = dict(context)
    if chain_key == USED_CAR_CHAIN_KEY:
        ctx = enrich_used_car_context(db, ctx)

    followup = (
        db.query(EventDefinition)
        .filter(EventDefinition.key == followup_definition_key, EventDefinition.is_active == 1)
        .first()
    )
    if not followup:
        logger.warning("schedule_event_chain: followup %s missing", followup_definition_key)

    row = EventProfileChain(
        game_profile_id=int(profile.id),
        chain_key=str(chain_key),
        status=CHAIN_STATUS_SCHEDULED,
        followup_definition_key=str(followup_definition_key),
        after_periods=after,
        due_period_index=int(due),
        context_json=json.dumps(ctx, ensure_ascii=False),
        created_period_index=period_index,
    )
    db.add(row)
    db.flush()
    return row


def ensure_scheduled_chain_events(db: Session, game_profile_id: int, period_index: int) -> int:
    """Создаёт pending-инстансы для цепочек с due_period_index <= period_index."""
    rows = (
        db.query(EventProfileChain)
        .filter(
            EventProfileChain.game_profile_id == game_profile_id,
            EventProfileChain.status == CHAIN_STATUS_SCHEDULED,
            EventProfileChain.due_period_index <= int(period_index),
        )
        .order_by(EventProfileChain.due_period_index.asc(), EventProfileChain.id.asc())
        .all()
    )
    created = 0
    for chain in rows:
        definition = (
            db.query(EventDefinition)
            .filter(
                EventDefinition.key == chain.followup_definition_key,
                EventDefinition.is_active == 1,
            )
            .first()
        )
        if not definition:
            logger.error(
                "ensure_scheduled_chain_events: definition %s missing profile=%s",
                chain.followup_definition_key,
                game_profile_id,
            )
            chain.status = CHAIN_STATUS_CANCELLED
            continue

        already = (
            db.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == game_profile_id,
                EventInstance.definition_id == definition.id,
                EventInstance.period_index == int(period_index),
                EventInstance.status == "pending",
            )
            .first()
        )
        if already:
            chain.status = CHAIN_STATUS_SURFACED
            chain.surfaced_instance_id = int(already.id)
            continue

        inst = EventInstance(
            game_profile_id=game_profile_id,
            period_index=int(period_index),
            definition_id=int(definition.id),
            status="pending",
        )
        db.add(inst)
        db.flush()
        chain.status = CHAIN_STATUS_SURFACED
        chain.surfaced_instance_id = int(inst.id)
        created += 1
    if created:
        db.commit()
    elif rows:
        db.commit()
    return created


def complete_chain(
    db: Session,
    chain: EventProfileChain,
    *,
    period_index: int,
    status: str = CHAIN_STATUS_COMPLETED,
) -> None:
    chain.status = status
    chain.completed_period_index = int(period_index)


def apply_enqueue_event_effect(db: Session, profile: GameProfile, spec: object) -> None:
    if not isinstance(spec, dict):
        raise ValueError("enqueue_event must be an object")
    chain_key = str(spec.get("chain_key") or "").strip()
    followup = str(spec.get("followup_definition_key") or "").strip()
    if not chain_key or not followup:
        raise ValueError("enqueue_event requires chain_key and followup_definition_key")
    after_periods = int(spec.get("after_periods", 2) or 2)
    context = spec.get("context") if isinstance(spec.get("context"), dict) else {}
    schedule_event_chain(
        db,
        profile,
        chain_key=chain_key,
        followup_definition_key=followup,
        after_periods=after_periods,
        context=context,
    )


def create_asset_from_deal(
    db: Session,
    profile: GameProfile,
    *,
    template_key: str,
    purchase_price: float,
    period_index: int,
    charge_cash: bool = True,
) -> FinanceAsset:
    tpl = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.template_key == template_key, AssetTemplate.is_active == 1)
        .first()
    )
    if not tpl:
        raise ValueError(f"Шаблон актива не найден: {template_key}")
    price = round(float(purchase_price), 2)
    if charge_cash and price > float(profile.cash_balance) + 1e-6:
        raise ValueError("Недостаточно средств на счёте для выкупа")

    from ..finance.balance_utils import adjust_balance

    if charge_cash and price > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-price,
            type="asset_purchase",
            description=f"Покупка: {tpl.title}",
            period_index=period_index,
        )

    asset = FinanceAsset(
        game_profile_id=profile.id,
        title=tpl.title,
        kind=tpl.kind,
        asset_value=price,
        monthly_maintenance_cost=float(tpl.monthly_maintenance_cost),
        monthly_income=float(tpl.monthly_income or 0),
        is_active=1,
    )
    db.add(asset)
    db.flush()
    return asset


def choice_allowed_for_chain_branch(choice_effects: dict, chain_context: dict[str, Any]) -> bool:
    required = choice_effects.get("requires_chain_branch")
    if not required:
        return True
    branch = str(chain_context.get("branch") or "")
    return str(required).strip() == branch


def resolve_used_car_deadline_choice(
    db: Session,
    profile: GameProfile,
    chain: EventProfileChain,
    choice_effects: dict[str, Any],
) -> dict[str, Any]:
    """Подставляет cash_delta / asset_from_template для part 2 по контексту цепочки."""
    ctx = enrich_used_car_context(db, _parse_json_obj(chain.context_json))
    action = str(choice_effects.get("used_car_action") or "").strip()
    out = dict(choice_effects)

    if action == "complete_purchase":
        remaining = float(ctx["remaining_cash_due"])
        out["cash_delta"] = -remaining
        out["asset_from_template"] = {
            "template_key": ctx["template_key"],
            "purchase_price": float(ctx["deal_price"]),
            "charge_cash": False,
        }
    elif action == "decline_with_deposit":
        out["cash_delta"] = 0
    elif action == "decline":
        out["cash_delta"] = 0
    return out


def resolve_choice_effects_for_definition(
    db: Session,
    profile: GameProfile,
    definition_key: str,
    effects: dict[str, Any],
) -> dict[str, Any]:
    if definition_key != "mq11_used_car_deadline":
        return effects
    chain = get_active_chain(db, profile.id, USED_CAR_CHAIN_KEY, statuses=(CHAIN_STATUS_SURFACED, CHAIN_STATUS_SCHEDULED))
    if not chain:
        return effects
    return resolve_used_car_deadline_choice(db, profile, chain, effects)


def apply_asset_from_template_effect(
    db: Session,
    profile: GameProfile,
    spec: object,
    *,
    period_index: int,
) -> FinanceAsset | None:
    if not isinstance(spec, dict):
        raise ValueError("asset_from_template must be an object")
    template_key = str(spec.get("template_key") or "").strip()
    if not template_key:
        raise ValueError("asset_from_template.template_key is required")
    purchase_price = spec.get("purchase_price")
    if purchase_price is None:
        list_price, deal_price = resolve_car_deal_prices(
            db,
            template_key=template_key,
            discount_rate=float(spec.get("discount_rate", USED_CAR_DEFAULT_DISCOUNT)),
        )
        purchase_price = deal_price if spec.get("use_deal_price") else list_price
    charge_cash = bool(spec.get("charge_cash", True))
    return create_asset_from_deal(
        db,
        profile,
        template_key=template_key,
        purchase_price=float(purchase_price),
        period_index=period_index,
        charge_cash=charge_cash,
    )
