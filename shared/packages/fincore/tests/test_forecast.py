"""SPL-206: прогноз — цепочка month_step, перенос состояния между месяцами."""

import pytest

from fincore.annuity import monthly_payment
from fincore.forecast import forecast, next_snapshot
from fincore.household import (
    ExpenseLine,
    HouseholdSnapshot,
    Income,
    InsurancePolicy,
    InvestmentPosition,
    Liability,
)
from fincore.month import month_step


def _snapshot(**kw) -> HouseholdSnapshot:
    loan = Liability(id=1, title="Кредит", total_debt=30_000.0, annual_rate_percent=12.0,
                     monthly_payment=monthly_payment(30_000.0, 12.0, 3), payment_mode="annuity", term_months=3)
    defaults = dict(
        month_index=1,
        cash=200_000.0,
        incomes=(Income(monthly_amount=40_000.0),),
        liabilities=(loan,),
        expense_lines=(ExpenseLine(id=1, category_key="food", title="Еда", amount_monthly=10_000.0),
                       ExpenseLine(id=2, category_key="leisure", title="Абонемент", amount_monthly=2_000.0,
                                   expires_month_index=2)),
        policies=(InsurancePolicy(id=1, title="ДМС", kind="health", monthly_premium=500.0,
                                  started_month_index=1, expires_month_index=3),),
        investments=(InvestmentPosition(id=1, kind="deposit", title="Вклад", principal=12_000.0,
                                        annual_rate_percent=12.0, last_accrued_month_index=1),),
    )
    defaults.update(kw)
    return HouseholdSnapshot(**defaults)


def test_first_month_equals_month_step():
    snap = _snapshot()
    assert forecast(snap, months=1)[0] == month_step(snap)


def test_months_chain_cash_and_month_index():
    results = forecast(_snapshot(), months=4)
    assert [r.month_index for r in results] == [1, 2, 3, 4]
    for prev, cur in zip(results, results[1:]):
        assert cur.cash_start == prev.cash_end


def test_paid_off_loan_drops_out_and_expiries_apply():
    results = forecast(_snapshot(), months=4)
    assert [len(r.liabilities) for r in results] == [1, 1, 1, 0]  # срок 3 месяца
    assert [r.burn.total for r in results] == [12_000.0, 10_000.0, 10_000.0, 10_000.0]  # абонемент истёк во 2-м
    assert [r.insurance_premiums for r in results] == [0.0, 500.0, 0.0, 0.0]  # оформлен в 1-м, истёк в 3-м


def test_deposit_capitalizes_month_after_month():
    results = forecast(_snapshot(), months=3)
    assert results[0].deposit_interest == 0.0  # уже начислено за 1-й месяц
    assert results[1].deposit_interest == pytest.approx(120.0)
    assert results[2].deposit_interest == pytest.approx(121.2)


def test_income_credited_each_month_on_request():
    without = forecast(_snapshot(), months=2)
    with_income = forecast(_snapshot(), months=2, credit_income=True)
    assert with_income[1].cash_end == pytest.approx(without[1].cash_end + 80_000.0)


def test_next_snapshot_keeps_overdue():
    snap = _snapshot(cash=0.0)
    result = month_step(snap)
    nxt = next_snapshot(snap, result)
    (li,) = nxt.liabilities
    assert li.overdue_amount == result.liabilities[0].overdue_amount > 0
    assert li.overdue_months == 1
    assert nxt.cash == result.cash_end


def test_months_must_be_positive():
    with pytest.raises(ValueError):
        forecast(_snapshot(), months=0)


def test_bond_pays_coupon_every_month_body_unchanged():
    bond = InvestmentPosition(id=1, kind="bond", title="ОФЗ", principal=12_000.0,
                              annual_rate_percent=12.0, last_accrued_month_index=0)
    results = forecast(HouseholdSnapshot(month_index=1, cash=0.0, investments=(bond,)), months=3)
    assert [r.bond_coupons for r in results] == pytest.approx([120.0, 120.0, 120.0])
    assert all(r.investments[0].principal == 12_000.0 for r in results)
    assert results[-1].cash_end == pytest.approx(360.0)


def test_overdue_repaid_once_income_arrives():
    card = Liability(id=1, title="Карта", total_debt=50_000.0, annual_rate_percent=30.0, monthly_payment=1_000.0)
    snap = HouseholdSnapshot(month_index=1, cash=0.0, incomes=(Income(monthly_amount=5_000.0),), liabilities=(card,))
    first, second = forecast(snap, months=2, credit_income=True)
    assert first.liabilities[0].overdue_amount == 0.0  # доход пришёл до платежа
    no_income_first = month_step(snap)
    assert no_income_first.liabilities[0].overdue_amount == 1_000.0
    nxt = next_snapshot(snap, no_income_first)
    (repaid,) = month_step(nxt, credit_income=True).liabilities
    assert (repaid.due, repaid.paid, repaid.overdue_amount, repaid.overdue_months) == (2_000.0, 2_000.0, 0.0, 0)


def test_interest_only_debt_stays_and_body_unchanged():
    card = Liability(id=1, title="Карта", total_debt=50_000.0, annual_rate_percent=30.0, monthly_payment=1_250.0)
    results = forecast(HouseholdSnapshot(month_index=1, cash=10_000.0, liabilities=(card,)), months=4)
    assert all(len(r.liabilities) == 1 and r.liabilities[0].total_debt == 50_000.0 for r in results)
    assert results[-1].cash_end == 5_000.0
