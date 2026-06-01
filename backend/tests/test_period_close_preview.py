"""Превью закрытия периода и grant в подушку."""
from app.finance.balance_utils import grant_safety_fund_balance
from app.finance.period_close_preview import estimate_period_close_preview
from tests.fixtures.game import create_game_profile, create_profile_ready_for_period_close


def test_estimate_period_close_preview_includes_burn(db_session, test_user):
    profile = create_game_profile(db_session, user_id=test_user.id, cash_balance=50_000.0)
    preview = estimate_period_close_preview(db_session, profile)
    assert preview["estimated_charges_total"] >= 0
    assert "estimated_cash_after_close" in preview


def test_defeat_if_close_negative_when_streak_is_two(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=1_000.0,
        negative_periods_count=2,
        base_monthly_lifestyle_expense=37_500.0,
    )
    preview = estimate_period_close_preview(db_session, profile)
    assert preview["would_be_negative_after_close"] is True
    assert preview["defeat_if_close_negative"] is True
    assert preview["negative_periods_count"] == 2


def test_preview_has_no_needs_penalty_line(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=50_000.0,
    )
    preview = estimate_period_close_preview(db_session, profile)
    types = {item.get("type") for item in preview.get("breakdown") or []}
    assert "needs_penalty" not in types


def test_grant_safety_fund_does_not_reduce_cash(db_session, test_user):
    profile = create_game_profile(db_session, user_id=test_user.id)
    profile.cash_balance = 10_000.0
    profile.safety_fund_balance = 1_000.0
    db_session.commit()

    grant_safety_fund_balance(
        db_session,
        profile.id,
        5000,
        "Тестовый вычет",
        int(profile.period_index),
    )
    db_session.refresh(profile)
    assert profile.cash_balance == 10_000.0
    assert profile.safety_fund_balance == 6_000.0
