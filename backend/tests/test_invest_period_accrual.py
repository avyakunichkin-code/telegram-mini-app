"""Начисления инвестиций в конце периода: купоны на счёт, % депозита."""

from __future__ import annotations

from app.game.period import process_period_end
from app.models import GameProfile, InvestmentPosition, Transaction
from app.services.invest.service import buy_bond, open_deposit


def _profile_ready(db_session, user_id: int, *, cash: float = 500_000) -> GameProfile:
    profile = GameProfile(
        user_id=user_id,
        name="Invest test",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        base_monthly_lifestyle_expense=9600.0,
        cash_balance=cash,
        safety_fund_balance=0,
        period_index=1,
        time_state="pause",
        period_duration_seconds=86400,
        is_active=1,
        last_period_salary_claimed=1,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


def test_bond_coupon_on_period_close_same_period_purchase(db_session, test_user):
    profile = _profile_ready(db_session, test_user.id, cash=200_000)
    buy_bond(
        db_session,
        profile,
        amount=100_000,
        annual_rate_percent=12.0,
        title="ОФЗ тест",
    )
    db_session.refresh(profile)

    pos = (
        db_session.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id)
        .first()
    )
    assert pos is not None
    assert int(pos.last_accrued_period) == int(profile.period_index) - 1

    closed_period = int(profile.period_index)
    result = process_period_end(db_session, profile)

    coupons = (
        db_session.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile.id,
            Transaction.type == "bond_coupon",
            Transaction.period_index == closed_period,
        )
        .all()
    )
    assert len(coupons) == 1
    expected = round(100_000 * (12.0 / 100 / 12), 2)
    assert float(coupons[0].amount) == expected
    assert any(h.get("key") == "bond_coupons" for h in result.get("period_highlights") or [])


def test_deposit_interest_capitalized_on_period_close(db_session, test_user):
    profile = _profile_ready(db_session, test_user.id, cash=300_000)
    open_deposit(db_session, profile, amount=50_000, annual_rate_percent=6.0)
    db_session.refresh(profile)

    result = process_period_end(db_session, profile)

    pos = (
        db_session.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id)
        .first()
    )
    assert pos is not None
    expected_interest = round(50_000 * (6.0 / 100 / 12), 2)
    assert float(pos.principal) == round(50_000 + expected_interest, 2)
    assert any(h.get("key") == "deposit_interest" for h in result.get("period_highlights") or [])
