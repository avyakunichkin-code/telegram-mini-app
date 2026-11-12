"""Виды обязательств и режимы платежа (DL1, ADR-010). Вход — примитивы, не ORM."""

from __future__ import annotations

from .annuity import monthly_interest_payment, monthly_payment

LIABILITY_KIND_UNSECURED = "unsecured"
LIABILITY_KIND_CONSUMER = "consumer"
LIABILITY_KIND_MORTGAGE = "mortgage"
LIABILITY_KIND_AUTO_LOAN = "auto_loan"

SECURED_KINDS = frozenset({LIABILITY_KIND_MORTGAGE, LIABILITY_KIND_AUTO_LOAN})
CONSUMER_KINDS = frozenset({LIABILITY_KIND_CONSUMER, LIABILITY_KIND_UNSECURED})

PAYMENT_MODE_ANNUITY = "annuity"
PAYMENT_MODE_INTEREST_ONLY = "interest_only"

DISBURSE_TO_CASH = "to_cash"
DISBURSE_TO_ASSET = "to_asset_purchase"


def effective_kind(liability_kind: str | None) -> str:
    """Вид обязательства; без значения — необеспеченный долг (legacy-строки)."""
    if liability_kind:
        return str(liability_kind)
    return LIABILITY_KIND_UNSECURED


def effective_payment_mode(payment_mode: str | None, term_periods: int | None) -> str:
    """Режим платежа; без значения — аннуитет при заданном сроке, иначе только проценты."""
    if payment_mode:
        return str(payment_mode)
    if term_periods is not None and int(term_periods) > 0:
        return PAYMENT_MODE_ANNUITY
    return PAYMENT_MODE_INTEREST_ONLY


def new_liability_schedule(
    principal: float,
    annual_rate_percent: float,
    payment_mode: str,
    term_months: int | None,
) -> tuple[float, int | None]:
    """
    Платёж и срок нового долга: аннуитет — по графику на `term_months`,
    иначе — только проценты без срока. Аннуитет без срока — ошибка.
    """
    if payment_mode == PAYMENT_MODE_ANNUITY:
        term = int(term_months or 0)
        if term <= 0:
            raise ValueError("annuity liability requires term_months > 0")
        return monthly_payment(principal, annual_rate_percent, term), term
    return monthly_interest_payment(principal, annual_rate_percent), None


def remaining_periods(term_periods: int | None, periods_paid: int | None) -> int:
    """Сколько месяцев платежей осталось; 0 — бессрочный долг или срок выплачен."""
    term = int(term_periods or 0)
    if term <= 0:
        return 0
    return max(0, term - int(periods_paid or 0))
