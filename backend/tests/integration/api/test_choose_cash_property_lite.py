"""
CS: property-lite — cash_delta при choose события (backlog #5).

Инвариант: после успешного choose cash finite; при отказе баланс не меняется.
"""

from __future__ import annotations

import pytest

from app.models import GameProfile
from tests.fixtures.events import seed_cash_delta_event
from tests.fixtures.game import create_game_profile
from tests.fixtures.money import assert_finite_money


pytestmark = pytest.mark.integration


def _activate_profile(db_session, test_user, profile: GameProfile) -> None:
    rows = db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).all()
    for row in rows:
        row.is_active = 1 if row.id == profile.id else 0
    db_session.commit()


@pytest.mark.parametrize(
    "initial_cash, cash_delta, expect_status",
    [
        (20_000.0, -3_000.0, 200),
        (20_000.0, 7_500.5, 200),
        (5_000.0, -5_000.0, 200),
        (5_000.0, -5_000.01, 400),
        (0.0, 100.0, 200),
        (99_999_999.0, -50_000_000.0, 200),
    ],
    ids=[
        "debit_ok",
        "credit_ok",
        "debit_exact_balance",
        "debit_insufficient",
        "credit_from_zero",
        "large_debit_ok",
    ],
)
def test_choose_cash_delta_finite_or_rejected(
    client,
    db_session,
    test_user,
    initial_cash,
    cash_delta,
    expect_status,
):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        cash_balance=initial_cash,
        period_index=2,
    )
    _activate_profile(db_session, test_user, profile)

    inst, choice = seed_cash_delta_event(
        db_session,
        profile.id,
        period_index=2,
        cash_delta=cash_delta,
        key=f"prop_{abs(hash((initial_cash, cash_delta))) % 10_000}",
    )

    cash_before = float(profile.cash_balance)
    res = client.post(
        f"/api/game/events/{inst.id}/choose",
        json={"choice_id": choice.id},
    )
    assert res.status_code == expect_status

    db_session.refresh(profile)
    if expect_status == 200:
        assert_finite_money(profile.cash_balance)
        assert float(profile.cash_balance) == pytest.approx(
            cash_before + cash_delta, abs=0.02
        )
    else:
        assert float(profile.cash_balance) == pytest.approx(cash_before, abs=0.02)


def test_choose_cash_sequence_stays_finite(client, db_session, test_user):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        cash_balance=50_000.0,
        period_index=2,
    )
    _activate_profile(db_session, test_user, profile)

    deltas = (-1_000.0, 500.0, -250.5, 2_000.0, -10_000.0)
    for i, delta in enumerate(deltas):
        inst, choice = seed_cash_delta_event(
            db_session,
            profile.id,
            period_index=2,
            cash_delta=delta,
            key=f"prop_seq_{i}",
        )
        assert (
            client.post(
                f"/api/game/events/{inst.id}/choose",
                json={"choice_id": choice.id},
            ).status_code
            == 200
        )
        db_session.refresh(profile)
        assert_finite_money(profile.cash_balance)
