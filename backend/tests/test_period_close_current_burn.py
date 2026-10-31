"""ADR-011: burn at period close reflects in-period event deltas."""

from __future__ import annotations

import pytest

from app.finance.expense_defaults import expense_budget_for_template
from app.finance.expenses import compute_monthly_burn, ensure_expense_category_catalog, seed_expense_lines_from_budget
from app.game.period import process_period_end
from app.models import GameProfile


@pytest.fixture()
def student_profile_period1(db_session, test_user):
    ensure_expense_category_catalog(db_session)
    db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).update({"is_active": 0})
    profile = GameProfile(
        user_id=test_user.id,
        name="Burn close",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        base_monthly_lifestyle_expense=37500.0,
        is_active=1,
        period_index=1,
        cash_balance=100_000.0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    budget = expense_budget_for_template("mq_game_basic_v1", 37500.0, {})
    seed_expense_lines_from_budget(db_session, profile, budget, period_index=1)
    db_session.commit()
    return profile


def test_period_close_debits_current_burn_after_event_line(db_session, student_profile_period1):
    profile = student_profile_period1
    before = float(compute_monthly_burn(db_session, profile).total)
    assert before == pytest.approx(37500.0, abs=1.0)

    profile.delta_monthly_lifestyle_expense = -500.0
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    after = float(compute_monthly_burn(db_session, profile).total)
    assert after == pytest.approx(37000.0, abs=1.0)

    cash_before = float(profile.cash_balance)
    process_period_end(db_session, profile)
    db_session.commit()
    db_session.refresh(profile)

    assert float(profile.cash_balance) == pytest.approx(cash_before - 37000.0, abs=1.0)
