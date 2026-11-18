"""DL1: виды и режимы платежа обязательств. Правила — `fincore.liabilities` (ADR-016, SPL-202);
здесь адаптер ORM-строки `FinanceLiability` и игровые лимиты, которых нет в ядре."""

from __future__ import annotations

from fincore import liabilities as _core
from fincore.liabilities import (  # noqa: F401
    CONSUMER_KINDS,
    DISBURSE_TO_ASSET,
    DISBURSE_TO_CASH,
    LIABILITY_KIND_AUTO_LOAN,
    LIABILITY_KIND_CONSUMER,
    LIABILITY_KIND_MORTGAGE,
    LIABILITY_KIND_UNSECURED,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
    SECURED_KINDS,
)

from ..models import FinanceLiability

# Игровые правила и каталог активов — не часть ядра.
MAX_ACTIVE_CONSUMER_LOANS = 2

ASSET_KIND_FOR_AUTO = frozenset({"car", "car_personal", "car_taxi"})


def effective_liability_kind(liability: FinanceLiability) -> str:
    return _core.effective_kind(getattr(liability, "liability_kind", None))


def effective_payment_mode(liability: FinanceLiability) -> str:
    return _core.effective_payment_mode(
        getattr(liability, "payment_mode", None),
        getattr(liability, "term_periods", None),
    )


def remaining_periods(liability: FinanceLiability) -> int:
    return _core.remaining_periods(
        getattr(liability, "term_periods", 0),
        getattr(liability, "periods_paid", 0),
    )
