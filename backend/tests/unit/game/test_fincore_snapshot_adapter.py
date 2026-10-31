"""SPL-203: игровой профиль → HouseholdSnapshot ядра (ADR-016). Адаптер только читает."""

from __future__ import annotations

from datetime import datetime

import pytest

from app.finance.expenses import compute_monthly_burn, ensure_expense_category_catalog
from app.game.adapters.fincore_snapshot import build_household_snapshot
from app.models import (
    FinanceAsset,
    FinanceLiability,
    InsurancePolicy,
    InvestmentPosition,
    ProfileExpenseLine,
)
from fincore.household import HouseholdSnapshot
from tests.fixtures.game import create_profile_ready_for_period_close


def _line(profile_id: int, category: str, amount: float, **kw) -> ProfileExpenseLine:
    return ProfileExpenseLine(game_profile_id=profile_id, category_key=category, amount_monthly=amount, **kw)


@pytest.fixture()
def profile(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        period_index=3,
        cash_balance=12_345.67,
        safety_fund_balance=5_000.0,
        delta_monthly_lifestyle_expense=1_500.0,
    )
    ensure_expense_category_catalog(db_session)
    db_session.add_all(
        [
            FinanceLiability(
                game_profile_id=profile.id,
                title="Автокредит",
                total_debt=90_000.0,
                annual_rate_percent=12.0,
                monthly_payment=4_000.0,
                overdue_amount=500.0,
                overdue_periods=1,
                liability_kind="auto_loan",
                payment_mode="annuity",
                term_periods=24,
                periods_paid=2,
            ),
            FinanceLiability(
                game_profile_id=profile.id,
                title="Погашен",
                total_debt=0.0,
                annual_rate_percent=10.0,
                monthly_payment=0.0,
                is_active=0,
            ),
            FinanceAsset(
                game_profile_id=profile.id,
                title="Машина",
                kind="car",
                asset_value=400_000.0,
                monthly_maintenance_cost=3_000.0,
                monthly_income=0.0,
            ),
            _line(profile.id, "food", 10_000.0),
            _line(profile.id, "leisure", 2_000.0, title_override="Кино", tier="discretionary", expires_period_index=5),
            _line(profile.id, "transport", 9_999.0, expires_period_index=3),  # истекла к периоду 3
            _line(profile.id, "other", 7_777.0, revoked_at=datetime(2026, 1, 1)),
            InsurancePolicy(
                game_profile_id=profile.id,
                kind="auto",
                title="ОСАГО",
                monthly_premium=800.0,
                coverage_limit=100_000.0,
                started_period_index=2,
                expires_period_index=14,
            ),
            InvestmentPosition(
                game_profile_id=profile.id,
                kind="deposit",
                title="Вклад",
                principal=20_000.0,
                annual_rate_percent=14.0,
                started_period=1,
                last_accrued_period=2,
            ),
        ]
    )
    db_session.commit()
    db_session.refresh(profile)
    return profile


def test_snapshot_maps_financial_state(db_session, profile):
    snap = build_household_snapshot(db_session, profile)

    assert isinstance(snap, HouseholdSnapshot)
    assert snap.month_index == 3
    assert snap.cash == pytest.approx(12_345.67)
    assert snap.safety_fund == 5_000.0
    assert snap.monthly_income == 50_000.0

    (liability,) = snap.liabilities  # неактивные не попадают
    assert liability.kind == "auto_loan"
    assert liability.payment_mode == "annuity"
    assert (liability.term_months, liability.months_paid) == (24, 2)
    assert (liability.overdue_amount, liability.overdue_months) == (500.0, 1)
    assert snap.debt_with_overdue == 90_500.0

    (asset,) = snap.assets
    assert (asset.kind, asset.value, asset.monthly_maintenance) == ("car", 400_000.0, 3_000.0)

    assert {(line.category_key, line.title, line.amount_monthly) for line in snap.expense_lines} == {
        ("food", "Еда", 10_000.0),
        ("leisure", "Кино", 2_000.0),
    }
    (policy,) = snap.policies
    assert (policy.started_month_index, policy.expires_month_index, policy.claimed_month_index) == (2, 14, None)
    (position,) = snap.investments
    assert (position.kind, position.last_accrued_month_index) == ("deposit", 2)


def test_lifestyle_total_matches_game_burn(db_session, profile):
    snap = build_household_snapshot(db_session, profile)
    total = max(0.0, sum(line.amount_monthly for line in snap.expense_lines) + snap.extra_monthly_expense)
    assert total == pytest.approx(compute_monthly_burn(db_session, profile).total)


def test_negative_delta_matches_game_burn_after_clamp(db_session, profile):
    profile.delta_monthly_lifestyle_expense = -50_000.0  # больше суммы статей
    db_session.commit()

    snap = build_household_snapshot(db_session, profile)
    assert snap.extra_monthly_expense == -50_000.0
    total = max(0.0, sum(line.amount_monthly for line in snap.expense_lines) + snap.extra_monthly_expense)
    assert total == compute_monthly_burn(db_session, profile).total == 0.0


def test_profile_without_lines_falls_back_to_base_budget(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, base_monthly_lifestyle_expense=0.0
    )
    profile.base_monthly_lifestyle_expense = 30_000.0  # после создания: без backfill статей
    db_session.commit()

    snap = build_household_snapshot(db_session, profile)
    assert snap.expense_lines == ()
    assert snap.extra_monthly_expense == 30_000.0


def test_adapter_is_read_only(db_session, profile):
    lines_before = db_session.query(ProfileExpenseLine).count()
    build_household_snapshot(db_session, profile)
    assert not db_session.new and not db_session.dirty
    assert db_session.query(ProfileExpenseLine).count() == lines_before
