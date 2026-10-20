"""Unit-тесты ядра без приложения. Golden-значения аннуитета — backend/tests/test_dl1_annuity_golden.py."""

import pytest

from fincore.annuity import monthly_interest_payment, monthly_payment, split_full_payment
from fincore.invest import InvestProduct, UnknownInvestProduct, find_invest_product
from fincore.liabilities import (
    LIABILITY_KIND_UNSECURED,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
    effective_kind,
    effective_payment_mode,
    remaining_periods,
)
from fincore.money import quantize_money


def test_quantize_money_half_up():
    assert quantize_money(0.005) == 0.01
    assert quantize_money(10) == 10.0


def test_annuity_zero_rate_splits_evenly():
    assert monthly_payment(1200, 0, 12) == 100.0


def test_annuity_rejects_non_positive_term():
    with pytest.raises(ValueError):
        monthly_payment(1000, 10, 0)


def test_last_payment_principal_capped_by_body():
    interest, principal, new_debt = split_full_payment(50, 12, 1000)
    assert (interest, principal, new_debt) == (0.5, 50.0, 0.0)


def test_interest_only_payment():
    assert monthly_interest_payment(120_000, 12) == 1200.0


def test_liability_defaults_for_legacy_rows():
    assert effective_kind(None) == LIABILITY_KIND_UNSECURED
    assert effective_payment_mode(None, 24) == PAYMENT_MODE_ANNUITY
    assert effective_payment_mode(None, None) == PAYMENT_MODE_INTEREST_ONLY
    assert effective_payment_mode("interest_only", 24) == PAYMENT_MODE_INTEREST_ONLY


def test_remaining_periods():
    assert remaining_periods(24, 5) == 19
    assert remaining_periods(24, 30) == 0
    assert remaining_periods(None, 3) == 0


def test_find_invest_product_in_app_catalog():
    deposit = InvestProduct(kind="deposit", annual_rate_percent=10.0, default_title="Вклад")
    assert find_invest_product({"deposit": deposit}, "deposit") is deposit


def test_unknown_invest_product_is_domain_error():
    with pytest.raises(UnknownInvestProduct) as exc:
        find_invest_product({}, "crypto")
    assert isinstance(exc.value, ValueError)
    assert exc.value.kind == "crypto"
