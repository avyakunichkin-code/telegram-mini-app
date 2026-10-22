"""Оценка баланса после закрытия периода — тот же расчёт месяца, что в закрытии (SPL-206), без записи итогов."""
from __future__ import annotations

from sqlalchemy.orm import Session

from fincore.forecast import forecast

from ..finance.expenses import ensure_expense_category_catalog, ensure_profile_expense_lines, expense_categories_for_core
from ..game.adapters.fincore_snapshot import build_household_snapshot
from ..models import GameProfile


def estimate_period_close_preview(db: Session, profile: GameProfile) -> dict:
    """
    Cash после автосписаний и начислений в конце месяца: `fincore.forecast` на один месяц по снимку профиля.
    Совпадает с `process_period_end` при тех же данных (включая купоны облигаций).
    Статьи создаются из базы шаблона, если их нет (как в закрытии); остальное не пишется.

    Исключение: если в этом периоде истекают все статьи, закрытие сначала их деактивирует, а потом
    создаёт заново из базы шаблона. Превью ничего не деактивирует и посчитает только дельту.
    Так было и до SPL-206.
    """
    ensure_expense_category_catalog(db)
    ensure_profile_expense_lines(db, profile)
    (month,) = forecast(
        build_household_snapshot(db, profile),
        months=1,
        categories=expense_categories_for_core(db),
    )

    # Строки — в порядке проводок закрытия; списания — без доходов (аренда, купоны).
    lines = [
        ("asset", "Содержание имущества", month.asset_maintenance, True),
        ("asset_income", "Доход от активов", month.asset_income, False),
        ("liability", "Платежи по обязательствам", sum(o.paid for o in month.liabilities), True),
        ("lifestyle", "Расходы на жизнь", month.burn.total, True),
        ("insurance", "Страховые премии", month.insurance_premiums, True),
        ("bond_coupon", "Купоны по облигациям", month.bond_coupons, False),
    ]
    breakdown = [{"type": kind, "title": title, "amount": amount} for kind, title, amount, _ in lines if amount > 0]
    charges_total = 0.0
    for _kind, _title, amount, is_charge in lines:
        if is_charge and amount > 0:
            charges_total += amount

    neg_streak = int(getattr(profile, "negative_periods_count", 0) or 0)
    estimated = round(month.cash_end, 2)
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
