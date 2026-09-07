import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.balance_utils import TRANSACTION_TYPES, adjust_balance
from ...idempotency import load_stored_body, store_body, try_reserve_key, wait_stored_body
from ...models import FinanceSalary, GameProfile, PeriodSnapshot

logger = logging.getLogger(__name__)

SALARY_ROUTE_KEY = "game.period.claim_salary"


def salary_idempotency_key(profile_id: int, period_index: int) -> str:
    return f"{int(profile_id)}:{int(period_index)}:salary"


def _lock_profile(db: Session, profile_id: int) -> GameProfile:
    query = db.query(GameProfile).filter(GameProfile.id == profile_id)
    if db.get_bind().dialect.name != "sqlite":
        query = query.with_for_update()
    locked = query.first()
    if not locked:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return locked


def _snapshot_for_period(db: Session, profile: GameProfile) -> PeriodSnapshot:
    snapshot = (
        db.query(PeriodSnapshot)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.period_index == profile.period_index,
        )
        .first()
    )
    if snapshot:
        return snapshot
    snapshot = PeriodSnapshot(
        game_profile_id=profile.id,
        period_index=profile.period_index,
        safety_fund_total=profile.safety_fund_balance,
    )
    db.add(snapshot)
    db.flush()
    return snapshot


def _is_claimed(profile: GameProfile, snapshot: PeriodSnapshot) -> bool:
    return (
        profile.last_period_salary_claimed == profile.period_index
        or snapshot.salary_claimed == 1
    )


def _already_claimed_payload(
    profile: GameProfile, snapshot: PeriodSnapshot, salary: FinanceSalary | None
) -> dict:
    amount = float(snapshot.salary_amount or (salary.monthly_amount if salary else 0))
    return {
        "status": "success",
        "already_claimed": True,
        "amount": amount,
        "new_balance": float(profile.cash_balance),
        "message": f"Зарплата за период #{profile.period_index} уже получена",
    }


def _replay_after_lost_claim(
    db: Session,
    *,
    user_id: int,
    profile_id: int,
    key: str,
) -> dict:
    stored = wait_stored_body(
        db, user_id=user_id, route_key=SALARY_ROUTE_KEY, idempotency_key=key
    )
    profile = db.get(GameProfile, profile_id)
    if profile:
        snapshot = _snapshot_for_period(db, profile)
        salary = (
            db.query(FinanceSalary)
            .filter(FinanceSalary.game_profile_id == profile.id)
            .first()
        )
        if _is_claimed(profile, snapshot):
            return _already_claimed_payload(profile, snapshot, salary)
    if stored:
        return stored
    raise HTTPException(status_code=409, detail="Повторите запрос")


def claim_salary(db: Session, profile: GameProfile) -> dict:
    """Получить зарплату за текущий период (один раз за период; повтор — идемпотентный 200)."""
    user_id = int(profile.user_id)
    profile = _lock_profile(db, profile.id)
    period_index = int(profile.period_index)
    key = salary_idempotency_key(profile.id, period_index)
    snapshot = _snapshot_for_period(db, profile)
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()

    if _is_claimed(profile, snapshot):
        return _already_claimed_payload(profile, snapshot, salary)

    stored = load_stored_body(
        db, user_id=user_id, route_key=SALARY_ROUTE_KEY, idempotency_key=key
    )
    if stored:
        return stored

    if not try_reserve_key(
        db, user_id=user_id, route_key=SALARY_ROUTE_KEY, idempotency_key=key
    ):
        return _replay_after_lost_claim(
            db, user_id=user_id, profile_id=profile.id, key=key
        )

    if not salary or salary.monthly_amount <= 0:
        db.rollback()
        raise HTTPException(status_code=400, detail="Зарплата не настроена или равна нулю")

    amount = float(salary.monthly_amount)

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
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        db.rollback()
        raise

    first_claim = int(profile.last_period_salary_claimed or 0) == 0
    profile.last_period_salary_claimed = period_index
    snapshot.salary_claimed = 1
    snapshot.salary_amount = amount
    try:
        from ...admin.notify import notify_salary_claimed

        notify_salary_claimed(
            db,
            profile,
            period_index=period_index,
            amount=amount,
            first_claim=first_claim,
        )
    except Exception:
        logger.exception("Admin notify failed after salary claim profile_id=%s", profile.id)

    # Бонус XP за зарплату начисляется при закрытии периода (period_close_salary).
    body = {
        "status": "success",
        "already_claimed": False,
        "amount": amount,
        "new_balance": new_balance,
        "message": f"Вы получили зарплату: {amount:,.2f} ₽",
    }
    try:
        store_body(
            db,
            user_id=user_id,
            route_key=SALARY_ROUTE_KEY,
            idempotency_key=key,
            body=body,
        )
    except Exception:
        db.rollback()
        raise
    return body
