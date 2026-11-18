"""Сверка до копейки (SPEC_plan-v1 CS-2): на каждом месяце прогноза Σ проводок = Δcash."""

from __future__ import annotations

from decimal import Decimal

from fincore.forecast import forecast
from fincore.household import ExpenseLine, HouseholdSnapshot, Income, InsurancePolicy, InvestmentPosition, Liability
from fincore.liabilities import PAYMENT_MODE_ANNUITY, PAYMENT_MODE_INTEREST_ONLY


def _snapshot(cash: float) -> HouseholdSnapshot:
    return HouseholdSnapshot(
        month_index=321,
        cash=cash,
        incomes=(Income(monthly_amount=123_456.78, member_id="a"), Income(monthly_amount=54_321.09, member_id="b")),
        liabilities=(
            Liability(id=1, title="Ипотека", total_debt=4_199_999.99, annual_rate_percent=9.47, monthly_payment=41_037.13,
                      payment_mode=PAYMENT_MODE_ANNUITY, term_months=210, member_id="a"),
            Liability(id=2, title="Карта", total_debt=140_000.01, annual_rate_percent=29.9, monthly_payment=3_488.34,
                      payment_mode=PAYMENT_MODE_INTEREST_ONLY),
        ),
        expense_lines=(
            ExpenseLine(id=1, category_key="food", title="Еда", amount_monthly=41_234.57),
            ExpenseLine(id=2, category_key="cafe", title="Кафе", amount_monthly=12_345.67, tier="want"),
        ),
        policies=(InsurancePolicy(id=1, title="Жизнь", kind="life", monthly_premium=1_234.56, started_month_index=320),),
        investments=(
            InvestmentPosition(id=1, kind="deposit", title="Вклад", principal=100_000.33, annual_rate_percent=14.3, last_accrued_month_index=320),
            InvestmentPosition(id=2, kind="bond", title="Облигация", principal=50_000.77, annual_rate_percent=11.7, last_accrued_month_index=320),
        ),
    )


def _check(cash: float) -> None:
    for result in forecast(_snapshot(cash), months=24, credit_income=True):
        total = sum(Decimal(str(p.amount)) for p in result.postings)
        delta = Decimal(str(result.cash_end)) - Decimal(str(result.cash_start))
        assert abs(total.quantize(Decimal("0.01")) - delta) <= Decimal("0.01"), (result.month_index, total, delta)
        # остаток после каждой проводки — ровно копейки
        for p in result.postings:
            assert Decimal(str(p.cash_after)) == Decimal(str(p.cash_after)).quantize(Decimal("0.01"))


def test_postings_reconcile_with_cash_delta():
    _check(37_777.77)


def test_postings_reconcile_when_cash_runs_out():
    _check(0.0)
