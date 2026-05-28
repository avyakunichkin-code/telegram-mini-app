from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.balance_utils import TRANSACTION_TYPES, adjust_balance
from ...models import FinanceSalary, GameProfile
from .snapshot import get_current_period_snapshot


def claim_salary(db: Session, profile: GameProfile) -> dict:
    """Получить зарплату за текущий период (один раз за период; повтор — идемпотентный 200)."""
    snapshot = get_current_period_snapshot(db, profile)
    if profile.last_period_salary_claimed == profile.period_index or snapshot.salary_claimed == 1:
        salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
        amount = float(snapshot.salary_amount or (salary.monthly_amount if salary else 0))
        return {
            "status": "success",
            "already_claimed": True,
            "amount": amount,
            "new_balance": float(profile.cash_balance),
            "message": f"Зарплата за период #{profile.period_index} уже получена",
        }

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    if not salary or salary.monthly_amount <= 0:
        raise HTTPException(status_code=400, detail="Зарплата не настроена или равна нулю")

    amount = float(salary.monthly_amount)
    period_index = profile.period_index

    try:
        new_balance = adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=amount,
            type=TRANSACTION_TYPES["SALARY"],
            description=f"Зарплата за период #{period_index}",
            period_index=period_index,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    profile.last_period_salary_claimed = period_index
    snapshot.salary_claimed = 1
    snapshot.salary_amount = amount

    # Бонус XP за зарплату начисляется при закрытии периода (period_close_salary).
    db.commit()

    return {
        "status": "success",
        "already_claimed": False,
        "amount": amount,
        "new_balance": new_balance,
        "message": f"Вы получили зарплату: {amount:,.2f} ₽",
    }

