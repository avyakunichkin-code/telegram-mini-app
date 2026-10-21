"""
SPL-207: метрики `fincore.metrics` на снимке профиля совпадают с тем, что игра отдаёт сейчас
(overview и вход целей победы). Это страховка перед переводом потребителей на ядро.
"""

from __future__ import annotations

import pytest

from app.finance.expenses import compute_monthly_burn, ensure_expense_category_catalog
from app.finance.overview_build import build_finance_overview
from app.finance.period_metrics import avg_net_cashflow_last_closed_intervals
from app.game.adapters.fincore_snapshot import build_household_snapshot
from app.models import (
    FinanceAsset,
    FinanceLiability,
    InvestmentPosition,
    PeriodEconomyClosing,
    ProfileExpenseLine,
)
from app.victory.snap import build_victory_evaluation_input
from fincore.metrics import compute_metrics
from tests.fixtures.game import create_profile_ready_for_period_close


@pytest.fixture()
def profile(db_session, test_user, seed_basic_template):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        period_index=4,
        cash_balance=18_000.0,
        safety_fund_balance=24_000.0,
        delta_monthly_lifestyle_expense=-1_000.0,
    )
    ensure_expense_category_catalog(db_session)
    db_session.add_all(
        [
            FinanceLiability(
                game_profile_id=profile.id, title="Кредит", total_debt=80_000.0, annual_rate_percent=18.0,
                monthly_payment=4_321.55, overdue_amount=1_200.0, payment_mode="annuity", term_periods=24,
            ),
            FinanceLiability(
                game_profile_id=profile.id, title="Карта", total_debt=30_000.0, annual_rate_percent=24.0,
                monthly_payment=600.0,
            ),
            FinanceAsset(
                game_profile_id=profile.id, title="Сдаю комнату", kind="rental_home", asset_value=900_000.0,
                monthly_maintenance_cost=2_500.0, monthly_income=9_000.0,
            ),
            ProfileExpenseLine(game_profile_id=profile.id, category_key="food", amount_monthly=14_000.0),
            ProfileExpenseLine(game_profile_id=profile.id, category_key="housing", amount_monthly=11_000.0),
            InvestmentPosition(
                game_profile_id=profile.id, kind="deposit", title="Вклад", principal=33_333.33,
                annual_rate_percent=14.0, started_period=1, last_accrued_period=3,
            ),
            InvestmentPosition(
                game_profile_id=profile.id, kind="bond", title="ОФЗ", principal=10_000.0,
                annual_rate_percent=16.0, started_period=2, last_accrued_period=3,
            ),
        ]
    )
    db_session.commit()
    db_session.refresh(profile)
    compute_monthly_burn(db_session, profile)  # игровые подготовки до снимка (backfill статей)
    db_session.commit()
    return profile


def test_metrics_match_finance_overview(db_session, profile):
    m = compute_metrics(build_household_snapshot(db_session, profile))
    ov = build_finance_overview(db_session, profile)

    assert round(m.income_with_invest_projection, 2) == ov.total_monthly_income
    assert round(m.liability_payments, 2) == ov.total_monthly_liabilities_payment
    assert round(m.asset_maintenance, 2) == ov.total_monthly_assets_maintenance
    assert round(m.structural_obligations, 2) == ov.total_monthly_obligations
    assert round(m.lifestyle_burn, 2) == ov.monthly_burn_total
    assert round(m.total_monthly_outflow, 2) == ov.total_monthly_outflow
    assert round(m.net_structural_cashflow_with_invest, 2) == ov.net_monthly_cashflow
    assert round(m.expense_to_income_ratio, 4) == ov.expense_to_income_ratio
    assert round(m.liabilities_to_income_percent, 2) == ov.liabilities_to_income_ratio
    assert round(m.total_overdue, 2) == ov.total_overdue_amount


def test_avg_net_cashflow_uses_last_six_closings(db_session, profile):
    # Вставка не по порядку: функция сама сортирует по period_index.
    liquid = {1: 1_000.0, 2: 1_500.0, 3: 900.0, 4: 2_000.0, 5: 2_000.0, 6: 2_600.0, 7: 3_100.0, 8: 2_800.0}
    for period_index in (5, 1, 8, 3, 7, 2, 6, 4):
        db_session.add(
            PeriodEconomyClosing(
                game_profile_id=profile.id,
                period_index=period_index,
                cash_balance=liquid[period_index] - 100.0,
                safety_fund_balance=100.0,
            )
        )
    db_session.commit()

    avg, n = avg_net_cashflow_last_closed_intervals(db_session, profile.id, max_intervals=6)
    assert n == 6
    assert avg == round((2_800.0 - 1_500.0) / 6, 2)
    assert avg_net_cashflow_last_closed_intervals(db_session, profile.id + 999) == (0.0, 0)


def test_metrics_match_victory_input(db_session, profile):
    m = compute_metrics(build_household_snapshot(db_session, profile))
    vi = build_victory_evaluation_input(db_session, profile)

    assert m.structural_obligations == pytest.approx(vi.total_monthly_obligations)
    assert m.net_structural_cashflow == pytest.approx(vi.net_monthly_cashflow)  # без проекции вкладов
    assert m.lifestyle_burn == pytest.approx(vi.monthly_burn_total)
    assert m.total_monthly_outflow == pytest.approx(vi.monthly_expenses_total)
    assert m.total_overdue == pytest.approx(vi.total_overdue_amount)
    assert round(m.passive_income, 2) == vi.monthly_passive_income
    assert m.liquid == pytest.approx(vi.cash_balance + vi.safety_fund_balance)
    assert m.income_steady == pytest.approx(vi.monthly_salary + 9_000.0)  # зарплата + аренда
