"""DL1 annuity and payoff helpers (SPEC §4, ADR-010). Pure functions for tests and period_end."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

_EPS = Decimal("0.01")


def _q(value: Decimal | float | int) -> float:
    return float(Decimal(str(value)).quantize(_EPS, rounding=ROUND_HALF_UP))


def _monthly_rate(annual_rate_percent: float) -> Decimal:
    return Decimal(str(annual_rate_percent)) / Decimal("100") / Decimal("12")


def monthly_payment(total_debt: float, annual_rate_percent: float, remaining_periods: int) -> float:
    """Annuity payment A from (P, r, n). SPEC §4.1."""
    if remaining_periods <= 0:
        raise ValueError("remaining_periods must be > 0")
    p = Decimal(str(total_debt))
    n = int(remaining_periods)
    r = _monthly_rate(annual_rate_percent)
    if r == 0:
        return _q(p / n)
    one = (Decimal("1") + r) ** n
    pay = p * r * one / (one - Decimal("1"))
    return _q(pay)


def split_full_payment(
    total_debt: float,
    annual_rate_percent: float,
    monthly_payment_amount: float,
) -> tuple[float, float, float]:
    """
    One full scheduled payment: interest, principal, new total_debt.
    Last-period cap: principal cannot exceed remaining body.
    """
    p = Decimal(str(total_debt))
    r = _monthly_rate(annual_rate_percent)
    pay = Decimal(str(monthly_payment_amount))
    interest = _q(p * r)
    principal = pay - Decimal(str(interest))
    if principal > p:
        principal = p
    new_p = _q(p - principal)
    return interest, _q(principal), new_p


def apply_partial_payment(due_total: float, paid: float) -> tuple[float, float]:
    """Returns (unpaid -> overdue, paid). Body unchanged when paid < due."""
    due = float(due_total)
    paid_f = max(0.0, float(paid))
    applied = min(paid_f, due)
    unpaid = _q(due - applied)
    return unpaid, _q(applied)


def prepay_waterfall(
    amount: float,
    overdue_amount: float,
    total_debt: float,
) -> tuple[float, float, float, float]:
    """
    Waterfall: overdue first, then principal.
    Returns (new_overdue, new_debt, applied_overdue, applied_principal).
    """
    cash = max(0.0, float(amount))
    overdue = max(0.0, float(overdue_amount))
    body = max(0.0, float(total_debt))

    to_overdue = min(cash, overdue)
    cash -= to_overdue
    overdue -= to_overdue

    to_body = min(cash, body)
    body -= to_body

    return _q(overdue), _q(body), _q(to_overdue), _q(to_body)


def sale_cashflow(
    asset_value: float,
    overdue_amount: float,
    total_debt: float,
) -> tuple[float, float, float]:
    """payoff, cash_net, top_up_from_cash — SPEC §4.0."""
    payoff = _q(float(overdue_amount) + float(total_debt))
    sale = float(asset_value)
    cash_net = _q(max(0.0, sale - payoff))
    top_up = _q(max(0.0, payoff - sale))
    return payoff, cash_net, top_up
