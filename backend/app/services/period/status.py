from sqlalchemy.orm import Session

from ...models import FinanceAsset, FinanceLiability, FinanceSalary, GameProfile, PeriodSnapshot
from ...schemas import PeriodStatusResponse
from .snapshot import get_current_period_snapshot


def calculate_available_net_income(db: Session, profile: GameProfile, snapshot: PeriodSnapshot) -> float:
    """Рассчитывает доступный чистый доход за период (после обязательств)."""
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


def build_period_status(db: Session, profile: GameProfile) -> PeriodStatusResponse:
    snapshot = get_current_period_snapshot(db, profile)

    # Получаем зарплатную информацию
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    # Рассчитываем доступный доход
    net_income_available = calculate_available_net_income(db, profile, snapshot)

    # Проверяем, все ли необходимые действия выполнены
    required_actions_completed = snapshot.salary_claimed == 1  # Зарплата получена

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
        net_income_available=net_income_available,
    )

