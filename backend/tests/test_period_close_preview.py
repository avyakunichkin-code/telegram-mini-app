"""Превью закрытия периода и grant в подушку."""
from app.finance.balance_utils import grant_safety_fund_balance
from app.finance.period_close_preview import estimate_period_close_preview
from tests.fixtures.game import create_game_profile


def test_estimate_period_close_preview_includes_burn(db_session, test_user):
    profile = create_game_profile(db_session, user_id=test_user.id, cash_balance=50_000.0)
    preview = estimate_period_close_preview(db_session, profile)
    assert preview["estimated_charges_total"] >= 0
    assert "estimated_cash_after_close" in preview


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
