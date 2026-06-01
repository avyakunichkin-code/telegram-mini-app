from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...models import FinanceSalary, GameProfile
from ...schemas import SalaryProfileResponse, SalaryProfileUpdate


def get_or_create_salary_profile(db: Session, game_profile_id: int) -> FinanceSalary:
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == game_profile_id).first()
    if salary:
        return salary

    salary = FinanceSalary(game_profile_id=game_profile_id, monthly_amount=0, monthly_receipts_count=1)
    db.add(salary)
    db.commit()
    db.refresh(salary)
    return salary


def upsert_salary_profile(db: Session, game_profile: GameProfile, payload: SalaryProfileUpdate) -> SalaryProfileResponse:
    if payload.monthly_amount < 0:
        raise HTTPException(status_code=400, detail="monthly_amount must be >= 0")
    if payload.monthly_receipts_count <= 0:
        raise HTTPException(status_code=400, detail="monthly_receipts_count must be > 0")
    if game_profile.base_params_locked == 1:
        raise HTTPException(status_code=400, detail="Base parameters are locked after game start")

    profile = get_or_create_salary_profile(db, game_profile.id)
    profile.monthly_amount = payload.monthly_amount
    profile.monthly_receipts_count = payload.monthly_receipts_count
    db.commit()
    db.refresh(profile)

    return SalaryProfileResponse(
        monthly_amount=profile.monthly_amount,
        monthly_receipts_count=profile.monthly_receipts_count,
    )

