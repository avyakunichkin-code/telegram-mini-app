from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.auth import get_current_user
from app.database import get_db
from app.models import GameProfile, PeriodSnapshot, FinanceSalary, FinanceLiability, FinanceAsset
from app.schemas import SafetyFundContribution, PeriodStatusResponse, PeriodSummaryResponse
from app.game_time import get_active_game_profile, sync_time, get_seconds_until_next

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
            safety_fund_total=profile.safety_fund_total
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


@router.post("/claim-salary")
async def claim_salary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить зарплату за текущий период (один раз за период)"""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    snapshot = get_current_period_snapshot(db, profile)

    # Проверяем, не получали ли уже зарплату в этом периоде
    if snapshot.salary_claimed == 1:
        raise HTTPException(status_code=400, detail="Salary already claimed this period")

    # Получаем зарплату
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    if not salary:
        raise HTTPException(status_code=400, detail="Salary profile not configured")

    monthly_income = salary.monthly_amount
    if monthly_income <= 0:
        raise HTTPException(status_code=400, detail="Salary amount must be greater than 0")

    # Обновляем снимок периода
    snapshot.salary_claimed = 1
    snapshot.salary_amount = monthly_income
    db.commit()

    # Обновляем глобальный профиль
    profile.last_period_salary_claimed = profile.period_index

    # Обновляем финансовый обзор
    db.commit()

    return {
        "status": "success",
        "amount": monthly_income,
        "message": f"Вы получили зарплату: {monthly_income:,.2f} ₽"
    }


@router.post("/contribute-to-safety-fund")
async def contribute_to_safety_fund(
    contribution: SafetyFundContribution,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отложить деньги в подушку безопасности"""
    if contribution.amount <= 0:
        raise HTTPException(status_code=400, detail="Contribution amount must be positive")

    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    snapshot = get_current_period_snapshot(db, profile)

    # Проверяем, что сумма не превышает доступный доход
    net_income_available = calculate_available_net_income(db, profile, snapshot)

    if contribution.amount > net_income_available:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough available income. Available: {net_income_available:,.2f} ₽"
        )

    # Обновляем снимок периода
    snapshot.safety_fund_contribution += contribution.amount
    snapshot.safety_fund_total += contribution.amount
    snapshot.total_expenses += contribution.amount

    # Обновляем глобальный профиль
    profile.safety_fund_total += contribution.amount

    db.commit()

    return {
        "status": "success",
        "contributed": contribution.amount,
        "total_safety_fund": snapshot.safety_fund_total,
        "message": f"Отложено {contribution.amount:,.2f} ₽ в подушку безопасности"
    }


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

    # Рассчитываем XP за период
    xp_earned = 10  # Базовая награда
    if snapshot.salary_claimed:
        xp_earned += 20  # Бонус за получение зарплаты
    if net_savings > 0:
        xp_earned += min(30, int(net_savings / 1000))  # Бонус за сбережения

    # Обновляем XP и уровень профиля
    profile.xp += xp_earned

    # Обработка уровней
    xp_for_next_level = 100
    while profile.xp >= xp_for_next_level:
        profile.level += 1
        profile.xp -= xp_for_next_level
        xp_for_next_level = 100 + (profile.level - 1) * 50

    # Отмечаем период как завершённый
    snapshot.is_completed = 1
    snapshot.completed_at = datetime.utcnow()
    snapshot.net_savings = net_savings
    snapshot.xp_earned = xp_earned

    # Инкрементируем период
    profile.period_index += 1
    profile.period_anchor_at = datetime.utcnow()

    db.commit()

    return PeriodSummaryResponse(
        period_index=snapshot.period_index,
        salary_claimed=snapshot.salary_claimed == 1,
        salary_amount=snapshot.salary_amount,
        safety_fund_contribution=snapshot.safety_fund_contribution,
        safety_fund_total=snapshot.safety_fund_total,
        net_savings=net_savings,
        xp_earned=xp_earned,
        required_actions_completed=True
    )