"""SPL-205: шаг месяца — порядок проводок, долги и просрочка, премии, вклады, доход по флагу."""

import pytest

from fincore.annuity import monthly_payment, split_full_payment
from fincore.household import (
    Asset,
    ExpenseLine,
    HouseholdSnapshot,
    Income,
    InsurancePolicy,
    InvestmentPosition,
    Liability,
)
from fincore.insurance import premium_due
from fincore.month import (
    POSTING_ASSET_INCOME,
    POSTING_ASSET_MAINTENANCE,
    POSTING_BOND_COUPON,
    POSTING_INCOME,
    POSTING_INSURANCE_PREMIUM,
    POSTING_LIABILITY_PAYMENT,
    POSTING_LIFESTYLE_EXPENSE,
    installments_outstanding,
    month_step,
)


def _annuity(id_, principal, *, rate=12.0, term=12, **kw) -> Liability:
    return Liability(
        id=id_, title=f"Кредит {id_}", total_debt=principal, annual_rate_percent=rate,
        monthly_payment=monthly_payment(principal, rate, term), payment_mode="annuity", term_months=term, **kw,
    )


def _card(id_, payment, **kw) -> Liability:
    return Liability(id=id_, title=f"Карта {id_}", total_debt=50_000.0, annual_rate_percent=30.0,
                     monthly_payment=payment, **kw)


def test_postings_follow_contract_order_and_running_cash():
    snap = HouseholdSnapshot(
        month_index=3,
        cash=100_000.0,
        assets=(Asset(id=1, title="Квартира", kind="rental_home", value=1.0,
                      monthly_maintenance=2_000.0, monthly_income=10_000.0),),
        liabilities=(_card(1, 1_000.0),),
        expense_lines=(ExpenseLine(id=1, category_key="food", title="Еда", amount_monthly=20_000.0),),
        policies=(InsurancePolicy(id=1, title="ДМС", kind="health", monthly_premium=900.0, started_month_index=1),),
        investments=(InvestmentPosition(id=1, kind="bond", title="ОФЗ", principal=12_000.0,
                                        annual_rate_percent=12.0, last_accrued_month_index=2),),
    )
    result = month_step(snap)

    assert [p.kind for p in result.postings] == [
        POSTING_ASSET_MAINTENANCE, POSTING_ASSET_INCOME, POSTING_LIABILITY_PAYMENT,
        POSTING_LIFESTYLE_EXPENSE, POSTING_INSURANCE_PREMIUM, POSTING_BOND_COUPON,
    ]
    assert [p.amount for p in result.postings] == [-2_000.0, 10_000.0, -1_000.0, -20_000.0, -900.0, 120.0]
    assert [p.cash_after for p in result.postings] == [98_000.0, 108_000.0, 107_000.0, 87_000.0, 86_100.0, 86_220.0]
    assert result.cash_end == 86_220.0
    assert result.cash_start == 100_000.0


def test_income_credited_only_on_request():
    snap = HouseholdSnapshot(month_index=1, cash=0.0, incomes=(Income(monthly_amount=50_000.0),),
                             liabilities=(_card(1, 1_000.0),))
    assert month_step(snap).liabilities[0].unpaid == 1_000.0
    credited = month_step(snap, credit_income=True)
    assert credited.postings[0].kind == POSTING_INCOME
    assert credited.liabilities[0].paid == 1_000.0
    assert credited.cash_end == 49_000.0


def test_shortfall_pays_debts_in_snapshot_order():
    first, second = _card(1, 3_000.0), _card(2, 3_000.0)
    result = month_step(HouseholdSnapshot(month_index=1, cash=4_000.0, liabilities=(first, second)))
    a, b = result.liabilities
    assert (a.paid, a.unpaid, a.overdue_months) == (3_000.0, 0.0, 0)
    assert (b.paid, b.unpaid, b.overdue_amount, b.overdue_months) == (1_000.0, 2_000.0, 2_000.0, 1)
    assert result.overdue_added == 2_000.0
    assert result.cash_end == 0.0


def test_negative_cash_pays_nothing():
    result = month_step(HouseholdSnapshot(month_index=1, cash=-500.0, liabilities=(_card(1, 1_000.0, overdue_amount=200.0, overdue_months=1),)))
    (li,) = result.liabilities
    assert (li.due, li.paid, li.unpaid, li.overdue_months) == (1_200.0, 0.0, 1_200.0, 2)
    assert result.postings_of(POSTING_LIABILITY_PAYMENT) == ()


def test_annuity_partial_payment_keeps_body():
    loan = _annuity(1, 100_000.0)
    result = month_step(HouseholdSnapshot(month_index=1, cash=round(loan.monthly_payment * 0.4, 2), liabilities=(loan,)))
    (li,) = result.liabilities
    assert li.total_debt == 100_000.0
    assert li.months_paid == 0
    assert li.overdue_amount == pytest.approx(loan.monthly_payment * 0.6, abs=0.01)


def test_annuity_repaid_overdue_amortizes_two_installments():
    loan = _annuity(1, 100_000.0)
    due = loan.monthly_payment
    late = Liability(**{**loan.__dict__, "overdue_amount": due, "overdue_months": 1})
    (li,) = month_step(HouseholdSnapshot(month_index=2, cash=10 * due, liabilities=(late,))).liabilities
    _i, _p, after_first = split_full_payment(100_000.0, 12.0, due)
    _i, _p, after_second = split_full_payment(after_first, 12.0, due)
    assert (li.months_paid, li.overdue_amount, li.overdue_months) == (2, 0.0, 0)
    assert li.total_debt == after_second


def test_annuity_closes_on_last_term_month():
    loan = _annuity(1, 10_000.0, term=1)
    (li,) = month_step(HouseholdSnapshot(month_index=1, cash=1e6, liabilities=(loan,))).liabilities
    assert (li.is_active, li.total_debt, li.months_paid) == (False, 0.0, 1)


def test_running_cash_rounds_to_cents_like_app_ledger():
    snap = HouseholdSnapshot(
        month_index=1, cash=0.0,
        assets=(Asset(id=1, title="А", kind="x", value=1.0, monthly_income=100.005),),
        liabilities=(_card(1, 100.01),),
    )
    result = month_step(snap)
    assert result.postings[0].cash_after == 100.01  # 100.005 → 100.01 (ROUND_HALF_UP)
    assert result.liabilities[0].paid == 100.01
    assert result.cash_end == 0.0


def test_lifestyle_burn_clamped_and_posted_once():
    snap = HouseholdSnapshot(month_index=1, cash=0.0, extra_monthly_expense=-5_000.0,
                             expense_lines=(ExpenseLine(id=1, category_key="food", title="Еда", amount_monthly=3_000.0),))
    result = month_step(snap)
    assert result.burn.total == 0.0
    assert result.postings_of(POSTING_LIFESTYLE_EXPENSE) == ()


@pytest.mark.parametrize(
    ("policy_kw", "month", "due"),
    [
        ({"started_month_index": 1}, 2, 900.0),
        ({"started_month_index": 2}, 2, 0.0),  # месяц оформления: первая премия — при покупке
        ({"started_month_index": 1, "expires_month_index": 5}, 5, 0.0),
        ({"started_month_index": 1, "claimed_month_index": 3}, 4, 0.0),
    ],
)
def test_premium_due_rule(policy_kw, month, due):
    policy = InsurancePolicy(id=1, title="П", kind="health", monthly_premium=900.0, **policy_kw)
    assert premium_due(policy, month) == due


def test_deposit_capitalizes_and_catches_up_missed_months():
    snap = HouseholdSnapshot(month_index=3, cash=0.0, investments=(
        InvestmentPosition(id=1, kind="deposit", title="Вклад", principal=12_000.0,
                           annual_rate_percent=12.0, last_accrued_month_index=1),
        InvestmentPosition(id=2, kind="deposit", title="Свежий", principal=1_000.0,
                           annual_rate_percent=12.0, last_accrued_month_index=3),
    ))
    result = month_step(snap)
    (dep,) = result.investments  # уже начисленный в этом месяце пропущен
    assert dep.interest == pytest.approx(240.0)
    assert dep.principal == pytest.approx(12_240.0)
    assert dep.last_accrued_month_index == 3
    assert result.postings == ()
    assert result.deposit_interest == pytest.approx(240.0)


def test_installments_outstanding():
    assert installments_outstanding(0.0, 1_000.0) == 0
    assert installments_outstanding(1_000.0, 1_000.0) == 1
    assert installments_outstanding(1_000.01, 1_000.0) == 2
    assert installments_outstanding(500.0, 0.0) == 0
