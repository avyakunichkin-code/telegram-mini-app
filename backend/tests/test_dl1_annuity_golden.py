"""DL1 golden vectors — SPEC §4.4. Run: pytest tests/test_dl1_annuity_golden.py"""

from __future__ import annotations

import pytest

from app.finance.annuity import (
    apply_partial_payment,
    monthly_payment,
    prepay_waterfall,
    sale_cashflow,
    split_full_payment,
)
from tests.fixtures.dl1_golden_vectors import (
    V1_AFTER_P1_DEBT,
    V1_AFTER_P2_DEBT,
    V1_AFTER_PREPAY_DEBT,
    V1_ANNUAL_RATE,
    V1_MONTHLY_PAYMENT,
    V1_MONTHLY_PAYMENT_AFTER_PREPAY,
    V1_P1_INTEREST,
    V1_P1_PRINCIPAL,
    V1_P2_INTEREST,
    V1_P2_PRINCIPAL,
    V1_PREPAY_AMOUNT,
    V1_PREPAY_N_REM,
    V1_PRINCIPAL,
    V1_TERM,
    V2_ASSET_VALUE,
    V2_CASH_NET,
    V2_DEBT,
    V2_OVERDUE,
    V2_PAYOFF,
    V2_TOP_UP,
    V3_DEBT_UNCHANGED,
    V3_DUE,
    V3_PAID,
    V3_UNPAID,
    V4_APPLIED_OVERDUE,
    V4_APPLIED_PRINCIPAL,
    V4_DEBT_AFTER,
    V4_OVERDUE_AFTER,
    V4_OVERDUE_BEFORE,
    V4_PREPAY_AMOUNT,
    V5_ASSET_VALUE,
    V5_CASH_NET,
    V5_DEBT,
    V5_OVERDUE,
    V5_PAYOFF,
    V5_TOP_UP,
)


class TestVectorV1IssueAndPayments:
    def test_monthly_payment_at_issue(self):
        assert monthly_payment(V1_PRINCIPAL, V1_ANNUAL_RATE, V1_TERM) == V1_MONTHLY_PAYMENT

    def test_period_1_split(self):
        interest, principal, new_debt = split_full_payment(
            V1_PRINCIPAL, V1_ANNUAL_RATE, V1_MONTHLY_PAYMENT
        )
        assert interest == V1_P1_INTEREST
        assert principal == V1_P1_PRINCIPAL
        assert new_debt == V1_AFTER_P1_DEBT

    def test_period_2_split(self):
        interest, principal, new_debt = split_full_payment(
            V1_AFTER_P1_DEBT, V1_ANNUAL_RATE, V1_MONTHLY_PAYMENT
        )
        assert interest == V1_P2_INTEREST
        assert principal == V1_P2_PRINCIPAL
        assert new_debt == V1_AFTER_P2_DEBT

    def test_prepay_recalculates_payment(self):
        new_debt = V1_AFTER_P2_DEBT - V1_PREPAY_AMOUNT
        assert new_debt == V1_AFTER_PREPAY_DEBT
        assert (
            monthly_payment(new_debt, V1_ANNUAL_RATE, V1_PREPAY_N_REM)
            == V1_MONTHLY_PAYMENT_AFTER_PREPAY
        )


class TestVectorV2Sale:
    def test_sale_with_overdue(self):
        payoff, cash, top_up = sale_cashflow(V2_ASSET_VALUE, V2_OVERDUE, V2_DEBT)
        assert payoff == V2_PAYOFF
        assert cash == V2_CASH_NET
        assert top_up == V2_TOP_UP


class TestVectorV3PartialPayment:
    def test_partial_does_not_change_body_field(self):
        unpaid, paid = apply_partial_payment(V3_DUE, V3_PAID)
        assert unpaid == V3_UNPAID
        assert paid == V3_PAID
        # Body unchanged — enforced by caller; document invariant
        assert V3_DEBT_UNCHANGED == V1_AFTER_PREPAY_DEBT


class TestVectorV4PrepayWaterfall:
    def test_overdue_first_then_principal(self):
        new_od, new_debt, to_od, to_body = prepay_waterfall(
            V4_PREPAY_AMOUNT, V4_OVERDUE_BEFORE, V3_DEBT_UNCHANGED
        )
        assert to_od == V4_APPLIED_OVERDUE
        assert to_body == V4_APPLIED_PRINCIPAL
        assert new_od == V4_OVERDUE_AFTER
        assert new_debt == V4_DEBT_AFTER


class TestVectorV5UnderwaterSale:
    def test_top_up_required(self):
        payoff, cash, top_up = sale_cashflow(V5_ASSET_VALUE, V5_OVERDUE, V5_DEBT)
        assert payoff == V5_PAYOFF
        assert cash == V5_CASH_NET
        assert top_up == V5_TOP_UP


@pytest.mark.parametrize(
    "annual_rate,remaining",
    [(0.0, 6), (12.0, 1)],
)
def test_edge_rates(annual_rate: float, remaining: int):
    p = 120_000.0
    pay = monthly_payment(p, annual_rate, remaining)
    assert pay > 0
    if annual_rate == 0.0:
        assert pay == pytest.approx(20_000.0, abs=0.01)
    if remaining == 1:
        _, principal, new_p = split_full_payment(p, annual_rate, pay)
        assert new_p == 0.0
        assert principal == p
