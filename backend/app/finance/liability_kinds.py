"""DL1: kinds and payment modes for finance_liabilities."""

from __future__ import annotations

from ..models import FinanceLiability

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

MAX_ACTIVE_CONSUMER_LOANS = 2

ASSET_KIND_FOR_AUTO = frozenset({"car", "car_personal", "car_taxi"})


def effective_liability_kind(liability: FinanceLiability) -> str:
    raw = getattr(liability, "liability_kind", None)
    if raw:
        return str(raw)
    return LIABILITY_KIND_UNSECURED


def effective_payment_mode(liability: FinanceLiability) -> str:
    raw = getattr(liability, "payment_mode", None)
    if raw:
        return str(raw)
    term = getattr(liability, "term_periods", None)
    if term is not None and int(term) > 0:
        return PAYMENT_MODE_ANNUITY
    return PAYMENT_MODE_INTEREST_ONLY


def remaining_periods(liability: FinanceLiability) -> int:
    term = int(getattr(liability, "term_periods", 0) or 0)
    if term <= 0:
        return 0
    paid = int(getattr(liability, "periods_paid", 0) or 0)
    return max(0, term - paid)
