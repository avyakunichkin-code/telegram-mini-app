from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..balance_utils import adjust_balance
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..insurance_catalog import list_catalog, list_grid_catalog, list_plans, resolve_plan, resolve_product_object
from ..models import InsurancePolicy
from ..idempotency import read_idempotency_key, run_idempotent
from ..starter_mechanics import MECHANIC_CAPITAL_INSURANCE, require_capital_mechanic


router = APIRouter(prefix="/api/insurance", tags=["insurance"])


def _policy_to_dict(row: InsurancePolicy) -> dict:
    payout = float(row.payout_amount if row.payout_amount is not None else row.coverage_limit or 0)
    return {
        "id": row.id,
        "kind": row.kind,
        "product": row.product,
        "insured_object": row.insured_object,
        "title": row.title,
        "monthly_premium": row.monthly_premium,
        "payout_amount": payout,
        "coverage_limit": payout,
        "term_periods": int(row.term_periods or 0),
        "started_period_index": row.started_period_index,
        "expires_period_index": row.expires_period_index,
        "claimed_period_index": row.claimed_period_index,
        "is_active": bool(row.is_active),
    }


@router.get("/catalog")
async def insurance_catalog():
    """Справочник пар продукт × объект, сетка 2×2 и готовые тарифы."""
    return {
        "items": list_catalog(),
        "grid_items": list_grid_catalog(),
        "plans": list_plans(),
    }


@router.get("/policies")
async def list_policies(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    rows = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .order_by(InsurancePolicy.created_at.desc())
        .all()
    )
    return [_policy_to_dict(r) for r in rows]


@router.post("/buy")
async def buy_policy(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_key = (payload.get("plan_key") or "").strip()
    if plan_key:
        try:
            plan = resolve_plan(plan_key)
            spec = resolve_product_object(kind=plan.kind)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        monthly_premium = float(plan.monthly_premium)
        payout_amount = float(plan.payout_amount)
        term_periods = int(plan.term_periods)
        title = (payload.get("title") or "").strip() or f"{spec.title} — {plan.label}"
    else:
        try:
            spec = resolve_product_object(
                product=payload.get("product"),
                insured_object=payload.get("insured_object"),
                kind=payload.get("kind"),
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        title = (payload.get("title") or "").strip() or spec.title
        monthly_premium = float(payload.get("monthly_premium") or 0)
        payout_amount = float(payload.get("payout_amount") or payload.get("coverage_limit") or 0)
        term_periods = int(payload.get("term_periods") or 12)

    if monthly_premium <= 0:
        raise HTTPException(status_code=400, detail="monthly_premium must be > 0")
    if payout_amount <= 0:
        raise HTTPException(status_code=400, detail="payout_amount must be > 0")
    if term_periods <= 0:
        raise HTTPException(status_code=400, detail="term_periods must be > 0")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INSURANCE)
        started = int(profile.period_index or 1)
        expires = started + term_periods
        policy = InsurancePolicy(
            game_profile_id=profile.id,
            product=spec.product,
            insured_object=spec.insured_object,
            kind=spec.kind,
            title=title,
            monthly_premium=monthly_premium,
            payout_amount=payout_amount,
            coverage_limit=payout_amount,
            term_periods=term_periods,
            started_period_index=started,
            expires_period_index=expires,
            claimed_period_index=None,
            is_active=1,
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return {"status": "success", "policy_id": policy.id, "policy": _policy_to_dict(policy)}

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="insurance.buy",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/{policy_id}/cancel")
async def cancel_policy(policy_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    policy = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.id == policy_id, InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.is_active = 0
    db.commit()
    return {"status": "success"}


def expire_policies_for_period(db: Session, profile, period_index: int) -> int:
    """Деактивирует полисы с истёкшим сроком без выплаты. Возвращает число закрытых."""
    rows = (
        db.query(InsurancePolicy)
        .filter(
            InsurancePolicy.game_profile_id == profile.id,
            InsurancePolicy.is_active == 1,
            InsurancePolicy.claimed_period_index.is_(None),
        )
        .all()
    )
    n = 0
    for p in rows:
        exp = p.expires_period_index
        if exp is not None and period_index >= int(exp):
            p.is_active = 0
            n += 1
    if n:
        db.commit()
    return n


def charge_premiums_for_period(db: Session, profile, period_index: int) -> float:
    """Списывает премии по активным полисам (не истёкшим и не использованным)."""
    expire_policies_for_period(db, profile, period_index)
    policies = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .all()
    )
    total = 0.0
    for p in policies:
        if p.claimed_period_index is not None:
            continue
        exp = p.expires_period_index
        if exp is not None and period_index >= int(exp):
            continue
        total += float(p.monthly_premium)
    if total > 0:
        adjust_balance(db, profile.id, -total, "insurance_premium", f"Страховые премии за период #{period_index}", period_index)
        db.refresh(profile)
    return total
