# backend/app/finance_helpers.py
"""Формулы для обязательств и платежей (единый источник для API и игрового цикла)."""

from decimal import Decimal, ROUND_HALF_UP


def monthly_interest_payment(total_debt: float, annual_rate_percent: float) -> float:
    """
    Ежемесячный платёж процентов: тело × (ставка % годовых) / 100 / 12.
    Ставка в процентах годовых, период = «месяц» игры.
    """
    td = Decimal(str(total_debt))
    rate = Decimal(str(annual_rate_percent))
    pay = td * rate / Decimal("100") / Decimal("12")
    return float(pay.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
