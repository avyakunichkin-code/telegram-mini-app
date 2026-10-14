"""Выбор варианта события: идемпотентность, блокировка инстанса, применение эффектов."""
import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...events.chains import (
    FREELANCE_EPILOGUE_DEFINITION_KEYS,
    FREELANCE_PROJECT_CHAIN_KEY,
    USED_CAR_CHAIN_KEY,
    active_chain_context,
    apply_asset_from_template_effect,
    apply_enqueue_event_effect,
    choice_allowed_for_chain_branch,
    complete_chain,
    get_active_chain,
    resolve_choice_effects_for_definition,
)
from ...events.choice_snapshot import ensure_event_instance_choice_snapshot, parse_choice_snapshot
from ...events.constants import ALLOWED_EFFECT_KEYS
from ...events.insurance_hooks import apply_insurance_claim_from_effects
from ...finance.balance_utils import adjust_balance, adjust_safety_fund_balance, TRANSACTION_TYPES
from ...finance.expenses import add_expense_line_from_event
from ...game.rules import clamp_profile_lifestyle_delta
from ...idempotency import load_stored_body, store_body, try_reserve_key, wait_stored_body
from ...models import EventChoice, EventDefinition, EventInstance, GameProfile
from ...needs.engine import apply_needs_delta, needs_values_from_profile, parse_needs_delta
from ...timeutil import utc_now_naive
from .needs_rescue import _needs_config_for_profile
from .selection import record_event_profile_selection


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


CHOOSE_ROUTE_KEY = "game.events.choose"


def choose_idempotency_key(profile_id: int, event_id: int) -> str:
    return f"{int(profile_id)}:{int(event_id)}:choose"


def _lock_event_instance(
    db: Session, profile_id: int, event_id: int
) -> EventInstance | None:
    query = db.query(EventInstance).filter(
        EventInstance.id == event_id,
        EventInstance.game_profile_id == profile_id,
    )
    if db.get_bind().dialect.name != "sqlite":
        query = query.with_for_update()
    return query.first()


def _choose_replay_or_gone(
    db: Session, *, user_id: int, key: str, inst: EventInstance | None
) -> dict:
    stored = wait_stored_body(
        db, user_id=user_id, route_key=CHOOSE_ROUTE_KEY, idempotency_key=key
    )
    if stored:
        return stored
    if inst is not None and inst.status != "pending":
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Event not found or already resolved")


def choose_event(db: Session, profile: GameProfile, event_id: int, choice_id: int) -> dict:
    user_id = int(profile.user_id)
    key = choose_idempotency_key(profile.id, event_id)

    stored = load_stored_body(
        db, user_id=user_id, route_key=CHOOSE_ROUTE_KEY, idempotency_key=key
    )
    if stored:
        return stored

    inst = _lock_event_instance(db, profile.id, event_id)
    if not inst or inst.status != "pending":
        return _choose_replay_or_gone(db, user_id=user_id, key=key, inst=inst)

    if not try_reserve_key(
        db, user_id=user_id, route_key=CHOOSE_ROUTE_KEY, idempotency_key=key
    ):
        stored = wait_stored_body(
            db, user_id=user_id, route_key=CHOOSE_ROUTE_KEY, idempotency_key=key
        )
        if stored:
            return stored
        inst = db.get(EventInstance, event_id)
        if inst is not None and inst.status != "pending":
            return {"status": "success"}
        raise HTTPException(status_code=409, detail="Повторите запрос")

    try:
        return _apply_event_choice(db, profile, inst, choice_id, user_id=user_id, key=key)
    except Exception:
        db.rollback()
        raise


def _apply_event_choice(
    db: Session,
    profile: GameProfile,
    inst: EventInstance,
    choice_id: int,
    *,
    user_id: int,
    key: str,
) -> dict:
    ensure_event_instance_choice_snapshot(db, inst, profile)
    snapshot_ids = parse_choice_snapshot(inst)
    if snapshot_ids is not None and int(choice_id) not in snapshot_ids:
        raise HTTPException(status_code=400, detail="Выбор недоступен для этого события")

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

    chain_ctx = active_chain_context(db, profile, def_key)
    if chain_ctx and not choice_allowed_for_chain_branch(effects, chain_ctx):
        raise HTTPException(status_code=400, detail="Выбор недоступен для текущего этапа цепочки")

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
    elif def_key in FREELANCE_EPILOGUE_DEFINITION_KEYS:
        chain = get_active_chain(db, profile.id, FREELANCE_PROJECT_CHAIN_KEY)
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
    store_body(
        db,
        user_id=user_id,
        route_key=CHOOSE_ROUTE_KEY,
        idempotency_key=key,
        body=response,
    )
    return response
