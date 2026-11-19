"""Ставка инвест-продуктов — только серверная; закрытие позиции атомарно и однократно."""

from __future__ import annotations

from pathlib import Path
import re

import pytest
from fastapi import HTTPException

from app.finance.invest_products import INVEST_PRODUCTS
from app.models import GameProfile, InvestmentPosition
from app.services.invest import service as invest_service
from app.services.invest.service import close_position, open_deposit


@pytest.mark.parametrize("kind", ["deposit", "bond"])
def test_frontend_invest_rate_matches_server_catalog(kind):
    constants = Path(__file__).resolve().parents[2] / "web/src/constants/investProducts.js"
    match = re.search(
        rf"export const {kind.upper()}_ANNUAL_RATE_PERCENT = ([\d.]+);",
        constants.read_text(encoding="utf-8"),
    )
    assert match is not None
    assert float(match.group(1)) == INVEST_PRODUCTS[kind].annual_rate_percent


def _active_profile(db_session, user_id: int, *, cash: float = 200_000) -> GameProfile:
    profile = GameProfile(
        user_id=user_id,
        name="Invest rates",
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


def _positions(db_session, profile_id: int) -> list[InvestmentPosition]:
    return (
        db_session.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile_id)
        .all()
    )


def test_deposit_open_ignores_client_rate(client, db_session, test_user):
    profile = _active_profile(db_session, test_user.id)

    r = client.post(
        "/api/invest/deposit/open",
        json={"amount": 10_000, "annual_rate_percent": 100_000},
    )

    assert r.status_code == 200, r.text
    [pos] = _positions(db_session, profile.id)
    assert float(pos.annual_rate_percent) == INVEST_PRODUCTS["deposit"].annual_rate_percent


def test_bond_buy_ignores_client_rate(client, db_session, test_user):
    profile = _active_profile(db_session, test_user.id)

    r = client.post(
        "/api/invest/bond/buy",
        json={"amount": 10_000, "annual_rate_percent": 100_000, "title": "ОФЗ"},
    )

    assert r.status_code == 200, r.text
    [pos] = _positions(db_session, profile.id)
    assert float(pos.annual_rate_percent) == INVEST_PRODUCTS["bond"].annual_rate_percent
    assert pos.title == "ОФЗ"


def test_close_position_twice_credits_principal_once(db_session, test_user):
    profile = _active_profile(db_session, test_user.id, cash=100_000)
    pos_id = open_deposit(db_session, profile, amount=40_000)["position_id"]
    db_session.refresh(profile)
    assert float(profile.cash_balance) == 60_000

    close_position(db_session, profile, position_id=pos_id)
    with pytest.raises(HTTPException) as exc:
        close_position(db_session, profile, position_id=pos_id)

    assert exc.value.status_code == 404
    db_session.refresh(profile)
    assert float(profile.cash_balance) == 100_000


def test_close_position_failure_keeps_position_active(db_session, test_user, monkeypatch):
    profile = _active_profile(db_session, test_user.id, cash=100_000)
    pos_id = open_deposit(db_session, profile, amount=40_000)["position_id"]

    def boom(*_args, **_kwargs):
        raise RuntimeError("balance write failed")

    monkeypatch.setattr(invest_service, "adjust_balance", boom)
    with pytest.raises(RuntimeError):
        close_position(db_session, profile, position_id=pos_id)

    pos = db_session.get(InvestmentPosition, pos_id)
    db_session.refresh(pos)
    assert int(pos.is_active) == 1

@pytest.mark.parametrize(
    "route,kind",
    [("deposit/open", "deposit"), ("bond/buy", "bond")],
)
def test_repeat_purchase_merges_compatible_positions_and_replays(
    client, db_session, test_user, route, kind,
):
    from app.models import Transaction

    profile = _active_profile(db_session, test_user.id, cash=100_000)
    endpoint = f"/api/invest/{route}"
    first = client.post(endpoint, json={"amount": 10_000, "title": "First"})
    assert first.status_code == 200, first.text
    original_id = first.json()["position_id"]
    rate = INVEST_PRODUCTS[kind].annual_rate_percent
    db_session.add_all([
        InvestmentPosition(
            game_profile_id=profile.id, kind=kind, title="Legacy",
            principal=2_000, annual_rate_percent=legacy_rate,
            started_period=1, last_accrued_period=0, is_active=1,
        )
        for legacy_rate in (rate, rate - 1)
    ])
    db_session.commit()

    headers = {"Idempotency-Key": "top-up"}
    for _ in range(2):
        response = client.post(endpoint, json={"amount": 5_000}, headers=headers)
        assert response.status_code == 200, response.text
        assert response.json()["position_id"] == original_id

    active = {pos.id: pos.principal for pos in _positions(db_session, profile.id) if pos.is_active}
    assert active.pop(original_id) == 17_000
    assert list(active.values()) == [2_000]
    assert db_session.query(Transaction).filter_by(game_profile_id=profile.id).count() == 2
    db_session.refresh(profile)
    assert profile.cash_balance == 85_000

    close_position(db_session, profile, position_id=original_id)
    assert profile.cash_balance == 102_000


def test_purchase_rolls_back_when_idempotent_response_cannot_be_stored(
    client, db_session, test_user, monkeypatch,
):
    from app import idempotency

    profile = _active_profile(db_session, test_user.id, cash=100_000)
    headers = {"Idempotency-Key": "store-failure"}
    endpoint = "/api/invest/deposit/open"

    def fail(*args, **kwargs):
        raise RuntimeError("response write failed")

    with monkeypatch.context() as patch:
        patch.setattr(idempotency, "store_body", fail)
        with pytest.raises(RuntimeError, match="response write failed"):
            client.post(endpoint, json={"amount": 5_000}, headers=headers)
    db_session.rollback()
    db_session.refresh(profile)
    assert profile.cash_balance == 100_000
    assert _positions(db_session, profile.id) == []

    response = client.post(endpoint, json={"amount": 5_000}, headers=headers)
    assert response.status_code == 200, response.text
    db_session.refresh(profile)
    assert profile.cash_balance == 95_000
