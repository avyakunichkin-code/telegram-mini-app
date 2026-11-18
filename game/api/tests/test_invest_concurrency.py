"""Concurrent purchases and period close share the same profile lock."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy.orm import sessionmaker

from app.finance.invest_products import INVEST_PRODUCTS
from app.models import GameProfile, InvestmentPosition, Transaction
from app.services.invest.service import buy_bond, open_deposit
from app.services.period.close import close_open_period
from tests.fixtures.game import create_profile_ready_for_period_close


def _race(engine, *operations):
    session_factory = sessionmaker(bind=engine)
    start = Barrier(len(operations), timeout=10)

    def run(operation):
        with session_factory() as session:
            start.wait()
            return operation(session)

    with ThreadPoolExecutor(max_workers=len(operations)) as pool:
        futures = [pool.submit(run, operation) for operation in operations]
        return [future.result(timeout=15) for future in futures]


@pytest.mark.parametrize(
    ("purchase", "kind", "posting"),
    [(open_deposit, "deposit", "deposit_open"), (buy_bond, "bond", "bond_buy")],
)
def test_concurrent_purchases_share_position(db_engine, db_session, test_user, purchase, kind, posting):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id)
    profile_id = profile.id
    db_session.commit()

    first, second = _race(
        db_engine,
        lambda db: purchase(db, db.get(GameProfile, profile_id), amount=10_000),
        lambda db: purchase(db, db.get(GameProfile, profile_id), amount=15_000),
    )

    db_session.refresh(profile)
    position = db_session.query(InvestmentPosition).filter_by(
        game_profile_id=profile_id, kind=kind, is_active=1,
    ).one()
    postings = db_session.query(Transaction).filter_by(game_profile_id=profile_id, type=posting).all()
    assert first["position_id"] == second["position_id"] == position.id
    assert position.principal == 25_000
    assert sorted(row.amount for row in postings) == [-15_000, -10_000]
    assert profile.cash_balance == 25_000


def test_purchase_racing_period_close_accrues_once(db_engine, db_session, test_user):
    user_id = test_user.id
    profile = create_profile_ready_for_period_close(db_session, user_id=user_id)
    profile_id = profile.id
    position_id = buy_bond(db_session, profile, amount=10_000)["position_id"]

    purchase, closed = _race(
        db_engine,
        lambda db: buy_bond(db, db.get(GameProfile, profile_id), amount=5_000),
        lambda db: close_open_period(db, user_id, intended_period=1),
    )

    db_session.refresh(profile)
    position = db_session.query(InvestmentPosition).filter_by(
        game_profile_id=profile_id, kind="bond", is_active=1,
    ).one()
    purchases = db_session.query(Transaction).filter_by(
        game_profile_id=profile_id, type="bond_buy",
    ).order_by(Transaction.id).all()
    coupon = db_session.query(Transaction).filter_by(
        game_profile_id=profile_id, type="bond_coupon",
    ).one()

    assert purchase["position_id"] == position.id == position_id
    assert profile.period_index == closed.period_index == 2
    assert position.principal == 15_000
    assert position.last_accrued_period == coupon.period_index == 1
    assert [row.amount for row in purchases] == [-10_000, -5_000]
    assert purchases[1].period_index in (1, 2)
    principal_at_close = 15_000 if purchases[1].period_index == 1 else 10_000
    expected_coupon = principal_at_close * INVEST_PRODUCTS["bond"].annual_rate_percent / 1200
    assert coupon.amount == pytest.approx(expected_coupon)
    assert profile.cash_balance == pytest.approx(round(35_000 + expected_coupon, 2))
