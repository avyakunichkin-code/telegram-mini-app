"""Оценка баланса после закрытия периода (без записи в БД)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..finance.expenses import compute_monthly_burn
from ..models import FinanceAsset, FinanceLiability, GameProfile


def _estimate_insurance_premiums(db: Session, profile: GameProfile) -> float:
    try:
        from ..models import InsurancePolicy

        total = 0.0
        rows = (
            db.query(InsurancePolicy)
            .filter(
                InsurancePolicy.game_profile_id == profile.id,
                InsurancePolicy.is_active == 1,
            )
            .all()
        )
        for pol in rows:
            total += float(getattr(pol, "monthly_premium", 0) or getattr(pol, "premium_amount", 0) or 0)
        return round(total, 2)
    except Exception:
        return 0.0


def estimate_period_close_preview(db: Session, profile: GameProfile) -> dict:
    """
    Консервативная оценка cash после автосписаний в конце месяца.
    Порядок приближён к process_period_end (обслуживание → доход активов → долги → burn → страховки).
    """
    cash = float(profile.cash_balance or 0)
    charges_total = 0.0
    breakdown: list[dict] = []

    assets = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )
    maintenance = sum(float(a.monthly_maintenance_cost or 0) for a in assets)
    if maintenance > 0:
        cash -= maintenance
        charges_total += maintenance
        breakdown.append({"type": "asset", "title": "Содержание имущества", "amount": maintenance})

    assets_income = sum(float(getattr(a, "monthly_income", 0) or 0) for a in assets)
    if assets_income > 0:
        cash += assets_income
        breakdown.append({"type": "asset_income", "title": "Доход от активов", "amount": assets_income})

    liabilities = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    liability_paid = 0.0
    for liability in liabilities:
        monthly_due = float(liability.monthly_payment or 0)
        previous_overdue = float(getattr(liability, "overdue_amount", 0) or 0)
        due_total = monthly_due + previous_overdue
        paid = min(max(0.0, cash), due_total)
        cash -= paid
        liability_paid += paid
    if liability_paid > 0:
        charges_total += liability_paid
        breakdown.append({"type": "liability", "title": "Платежи по обязательствам", "amount": liability_paid})

    burn_total = float(compute_monthly_burn(db, profile).total)
    if burn_total > 0:
        cash -= burn_total
        charges_total += burn_total
        breakdown.append({"type": "lifestyle", "title": "Расходы на жизнь", "amount": burn_total})

    insurance = _estimate_insurance_premiums(db, profile)
    if insurance > 0:
        cash -= insurance
        charges_total += insurance
        breakdown.append({"type": "insurance", "title": "Страховые премии", "amount": insurance})

    neg_streak = int(getattr(profile, "negative_periods_count", 0) or 0)
    estimated = round(cash, 2)
    would_be_negative = estimated < -1e-6
    defeat_if_close_negative = would_be_negative and neg_streak >= 2

    return {
        "estimated_cash_after_close": estimated,
        "estimated_charges_total": round(charges_total, 2),
        "negative_periods_count": neg_streak,
        "would_be_negative_after_close": would_be_negative,
        "defeat_if_close_negative": defeat_if_close_negative,
        "breakdown": breakdown,
    }
