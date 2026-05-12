from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..balance_utils import adjust_balance
from ..models import InsurancePolicy


router = APIRouter(prefix="/api/insurance", tags=["insurance"])


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
    return [
        {
            "id": r.id,
            "kind": r.kind,
            "title": r.title,
            "monthly_premium": r.monthly_premium,
            "coverage_limit": r.coverage_limit,
        }
        for r in rows
    ]


@router.post("/buy")
async def buy_policy(payload: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    kind = (payload.get("kind") or "").strip()
    title = (payload.get("title") or "").strip()
    monthly_premium = float(payload.get("monthly_premium") or 0)
    coverage_limit = float(payload.get("coverage_limit") or 0)

    if kind not in {"health", "property", "car"}:
        raise HTTPException(status_code=400, detail="kind must be health|property|car")
    if not title:
        title = {"health": "Страхование здоровья", "property": "Страхование имущества", "car": "ОСАГО/КАСКО (условно)"}[kind]
    if monthly_premium <= 0:
        raise HTTPException(status_code=400, detail="monthly_premium must be > 0")
    if coverage_limit <= 0:
        raise HTTPException(status_code=400, detail="coverage_limit must be > 0")

    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    policy = InsurancePolicy(
        game_profile_id=profile.id,
        kind=kind,
        title=title,
        monthly_premium=monthly_premium,
        coverage_limit=coverage_limit,
        is_active=1,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return {"status": "success", "policy_id": policy.id}


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


def charge_premiums_for_period(db: Session, profile, period_index: int) -> float:
    """Списывает премии по всем активным полисам. Возвращает сумму списаний."""
    policies = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .all()
    )
    total = 0.0
    for p in policies:
        total += float(p.monthly_premium)
    if total > 0:
        adjust_balance(db, profile.id, -total, "insurance_premium", f"Страховые премии за период #{period_index}", period_index)
        db.refresh(profile)
    return total

