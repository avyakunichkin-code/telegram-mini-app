from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..balance_utils import adjust_balance, TRANSACTION_TYPES, adjust_safety_fund_balance
from ..database import get_db
from ..models import GameProfile, PeriodSnapshot, FinanceSalary, FinanceLiability, FinanceAsset
from ..schemas import SafetyFundContribution, PeriodStatusResponse, PeriodSummaryResponse
from ..game_time import get_active_game_profile, sync_time, get_seconds_until_next
from ..idempotency import read_idempotency_key, run_idempotent
from ..timeutil import utc_now_naive

router = APIRouter(prefix="/api/game/period", tags=["period"])


def get_current_period_snapshot(db: Session, profile: GameProfile, create_if_missing: bool = True) -> PeriodSnapshot:
    """Получает или создаёт снимок текущего периода"""
    snapshot = db.query(PeriodSnapshot).filter(
        PeriodSnapshot.game_profile_id == profile.id,
        PeriodSnapshot.period_index == profile.period_index
    ).first()

    if not snapshot and create_if_missing:
        snapshot = PeriodSnapshot(
            game_profile_id=profile.id,
            period_index=profile.period_index,
            safety_fund_total=profile.safety_fund_balance,
            )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

    return snapshot


def calculate_available_net_income(db: Session, profile: GameProfile, snapshot: PeriodSnapshot) -> float:
    """Рассчитывает доступный чистый доход за период (после обязательств)"""
    # Получаем зарплату
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    # Получаем обязательные платежи
    liabilities = db.query(FinanceLiability).filter(FinanceLiability.game_profile_id == profile.id).all()
    total_liability_payments = sum(l.monthly_payment for l in liabilities)

    # Расходы на обслуживание активов
    assets = db.query(FinanceAsset).filter(FinanceAsset.game_profile_id == profile.id).all()
    total_asset_maintenance = sum(a.monthly_maintenance_cost for a in assets)

    # Чистый доход после обязательных расходов
    net_income = monthly_income - total_liability_payments - total_asset_maintenance

    # Если уже получали зарплату в этом периоде — вычитаем
    if snapshot.salary_claimed:
        net_income -= snapshot.salary_amount

    return max(0, net_income)


@router.get("/status", response_model=PeriodStatusResponse)
async def get_period_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает статус текущего периода — какие действия выполнены"""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return build_period_status(db, profile)


def build_period_status(db: Session, profile: GameProfile) -> PeriodStatusResponse:
    snapshot = get_current_period_snapshot(db, profile)

    # Получаем зарплатную информацию
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    # Рассчитываем доступный доход
    net_income_available = calculate_available_net_income(db, profile, snapshot)

    # Проверяем, все ли необходимые действия выполнены
    required_actions_completed = (
        snapshot.salary_claimed == 1  # Зарплата получена
    )

    return PeriodStatusResponse(
        period_index=profile.period_index,
        salary_claimed=snapshot.salary_claimed == 1,
        salary_amount=snapshot.salary_amount,
        safety_fund_total=snapshot.safety_fund_total,
        safety_fund_contribution=snapshot.safety_fund_contribution,
        can_claim_salary=snapshot.salary_claimed == 0 and monthly_income > 0,
        can_contribute_to_fund=True,  # Всегда можно отложить из доступного дохода
        required_actions_completed=required_actions_completed,
        total_expenses=snapshot.total_expenses,
        net_income_available=net_income_available
    )


def _salary_claim_response(profile: GameProfile, amount: float, new_balance: float, *, already_claimed: bool) -> dict:
    return {
        "status": "success",
        "already_claimed": already_claimed,
        "amount": amount,
        "new_balance": new_balance,
        "message": (
            f"Вы получили зарплату: {amount:,.2f} ₽"
            if not already_claimed
            else f"Зарплата за период #{profile.period_index} уже получена"
        ),
    }


@router.post("/claim-salary")
async def claim_salary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить зарплату за текущий период (один раз за период; повтор — идемпотентный 200)."""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    snapshot = get_current_period_snapshot(db, profile)
    if profile.last_period_salary_claimed == profile.period_index or snapshot.salary_claimed == 1:
        salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
        amount = float(snapshot.salary_amount or (salary.monthly_amount if salary else 0))
        return _salary_claim_response(
            profile,
            amount,
            float(profile.cash_balance),
            already_claimed=True,
        )

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
        raise HTTPException(status_code=400, detail=str(e))

    profile.last_period_salary_claimed = period_index
    snapshot.salary_claimed = 1
    snapshot.salary_amount = amount

    # Бонус XP за зарплату начисляется при закрытии периода (period_close_salary).
    db.commit()

    return _salary_claim_response(
        profile,
        amount,
        new_balance,
        already_claimed=False,
    )


@router.post("/contribute-to-safety-fund")
async def contribute_to_safety_fund(
    request: Request,
    contribution: SafetyFundContribution,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Отложить деньги в подушку безопасности.
    Списывает указанную сумму с cash_balance и зачисляет на safety_fund_balance.
    """
    if contribution.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        if profile.cash_balance < contribution.amount:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно средств. Доступно: {profile.cash_balance:,.2f} ₽",
            )
        period_index = profile.period_index
        amount = contribution.amount
        snapshot = get_current_period_snapshot(db, profile)
        try:
            new_safety_fund = adjust_safety_fund_balance(
                db=db,
                game_profile_id=profile.id,
                amount=amount,
                type=TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"],
                description=f"Взнос в подушку безопасности #{period_index}",
                period_index=period_index,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        db.refresh(profile)
        snapshot.safety_fund_total = profile.safety_fund_balance
        snapshot.safety_fund_contribution = float(snapshot.safety_fund_contribution or 0) + amount
        db.commit()
        return {
            "status": "success",
            "contributed": amount,
            "new_cash_balance": profile.cash_balance,
            "new_safety_fund_balance": new_safety_fund,
            "message": f"Отложено {amount:,.2f} ₽ в подушку безопасности",
        }

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="period.contribute_safety_fund",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/complete-period", response_model=PeriodSummaryResponse)
async def complete_period(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Завершает текущий период (вызывается при Next или автоматически)
    Фиксирует итоги и переносит состояние в следующий период
    """
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    snapshot = get_current_period_snapshot(db, profile)

    if snapshot.is_completed == 1:
        raise HTTPException(status_code=400, detail="Period already completed")

    # Рассчитываем чистые сбережения
    net_savings = snapshot.safety_fund_contribution

    # Отмечаем период как завершённый
    snapshot.is_completed = 1
    snapshot.completed_at = utc_now_naive()
    snapshot.net_savings = net_savings
    snapshot.xp_earned = 0

    # Инкрементируем период
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()

    db.commit()

    return PeriodSummaryResponse(
        period_index=snapshot.period_index,
        salary_claimed=snapshot.salary_claimed == 1,
        salary_amount=snapshot.salary_amount,
        safety_fund_contribution=snapshot.safety_fund_contribution,
        safety_fund_total=snapshot.safety_fund_total,
        net_savings=net_savings,
        xp_earned=0,
        required_actions_completed=True,
    )


@router.post("/withdraw-from-safety-fund")
async def withdraw_from_safety_fund(
    request: Request,
    withdrawal: SafetyFundContribution,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Снять деньги с подушки безопасности на основной счёт.
    Без комиссии, без ограничений по периоду.
    """
    if withdrawal.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        if profile.safety_fund_balance < withdrawal.amount:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно средств на подушке безопасности. Доступно: {profile.safety_fund_balance:,.2f} ₽",
            )
        period_index = profile.period_index
        amount = withdrawal.amount
        snapshot = get_current_period_snapshot(db, profile)
        try:
            new_safety_fund = adjust_safety_fund_balance(
                db=db,
                game_profile_id=profile.id,
                amount=-amount,
                type=TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"],
                description=f"Снятие с подушки безопасности #{period_index}",
                period_index=period_index,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        db.refresh(profile)
        snapshot.safety_fund_total = profile.safety_fund_balance
        db.commit()
        return {
            "status": "success",
            "withdrawn": amount,
            "new_cash_balance": profile.cash_balance,
            "new_safety_fund_balance": new_safety_fund,
            "message": f"Снято {amount:,.2f} ₽ с подушки безопасности",
        }

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="period.withdraw_safety_fund",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()