"""Метрики ADR-009 на HouseholdSnapshot."""

import pytest

from fincore.household import (
    Asset,
    ExpenseLine,
    HouseholdSnapshot,
    Income,
    InvestmentPosition,
    Liability,
)
from fincore.metrics import average_liquid_delta, compute_metrics


def _snap(**overrides) -> HouseholdSnapshot:
    base = dict(
        month_index=5,
        cash=20_000.0,
        safety_fund=30_000.0,
        incomes=(Income(monthly_amount=60_000.0),),
        liabilities=(
            Liability(id=1, title="Ипотека", total_debt=1_000_000.0, annual_rate_percent=10.0,
                      monthly_payment=12_000.0, overdue_amount=2_000.0),
        ),
        assets=(Asset(id=1, title="Квартира", kind="home", value=1_500_000.0,
                      monthly_maintenance=3_000.0, monthly_income=5_000.0),),
        expense_lines=(ExpenseLine(id=1, category_key="food", title="Еда", amount_monthly=15_000.0),),
        extra_monthly_expense=0.0,
        investments=(InvestmentPosition(id=1, kind="deposit", title="Вклад", principal=12_000.0,
                                        annual_rate_percent=12.0, last_accrued_month_index=4),),
    )
    base.update(overrides)
    return HouseholdSnapshot(**base)


def test_adr009_structure_and_cashflow():
    m = compute_metrics(_snap())
    assert m.structural_obligations == 15_000.0
    assert m.lifestyle_burn == 15_000.0
    assert m.total_monthly_outflow == 30_000.0
    assert m.income_steady == 65_000.0
    assert m.invest_income_projection == pytest.approx(120.0)
    assert m.passive_income == pytest.approx(5_120.0)
    # Структурный поток не включает расходы на жизнь (ADR-009 §2.3).
    assert m.net_structural_cashflow == 50_000.0
    assert m.net_structural_cashflow_with_invest == pytest.approx(50_120.0)
    assert m.expense_to_income_ratio == pytest.approx(15_000.0 / 65_120.0)
    assert m.liabilities_to_income_percent == pytest.approx(12_000.0 / 65_120.0 * 100)


def test_balances_and_net_worth():
    m = compute_metrics(_snap())
    assert (m.total_debt, m.total_overdue, m.liquid) == (1_000_000.0, 2_000.0, 50_000.0)
    assert m.safety_fund_months == pytest.approx(1.0)
    assert m.net_worth == 50_000.0 + 1_500_000.0 + 12_000.0 - 1_000_000.0 - 2_000.0


def test_net_worth_does_not_double_count_annuity_overdue():
    annuity = Liability(id=2, title="Автокредит", total_debt=100_000.0, annual_rate_percent=12.0,
                        monthly_payment=5_000.0, overdue_amount=5_000.0, payment_mode="annuity", term_months=24)
    m = compute_metrics(_snap(liabilities=(annuity,)))
    assert m.total_overdue == 5_000.0
    assert m.net_worth == 50_000.0 + 1_500_000.0 + 12_000.0 - 100_000.0


def test_burn_clamped_and_zero_income_safe():
    m = compute_metrics(_snap(extra_monthly_expense=-100_000.0, incomes=(), assets=(), investments=()))
    assert m.lifestyle_burn == 0.0
    assert m.expense_to_income_ratio == 0.0
    assert m.liabilities_to_income_percent == 0.0


def test_invest_projection_skips_empty_positions():
    empty = InvestmentPosition(id=2, kind="bond", title="Пусто", principal=0.0,
                               annual_rate_percent=16.0, last_accrued_month_index=0)
    assert compute_metrics(_snap(investments=(empty,))).invest_income_projection == 0.0


def test_average_liquid_delta_last_intervals():
    assert average_liquid_delta([100.0]) == (0.0, 0)
    assert average_liquid_delta([100.0, 150.0, 120.0]) == (10.0, 2)
    series = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 1_000.0]
    assert average_liquid_delta(series, max_intervals=6) == (round((1_000.0 - 10.0) / 6, 2), 6)
    assert average_liquid_delta(series, max_intervals=1) == (940.0, 1)
    assert average_liquid_delta(series, max_intervals=0) == (0.0, 0)
    assert average_liquid_delta(series, max_intervals=-1) == (0.0, 0)
