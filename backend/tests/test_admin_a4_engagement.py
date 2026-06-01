"""A4: first_salary / first_safety_fund, period_closed economy, stuck heuristics."""

from __future__ import annotations

from datetime import timedelta

import pytest

from app.admin.notify import (
    notify_first_safety_fund,
    notify_first_salary_claimed,
    notify_period_closed,
    notify_salary_claimed,
)
from app.admin.stuck_scan import (
    is_onboarding_stuck,
    is_player_stuck,
    maybe_emit_player_stuck,
    profile_stuck_kind,
)
from app.admin.notify_messages import format_alert_message_ru
from app.models import GameProfile, NotificationLog, User
from app.timeutil import utc_now_naive


def test_first_salary_claimed_dedupe(db_session, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: False)
    profile = GameProfile(user_id=1, name="A", save_kind="game", period_index=1)
    db_session.add(profile)
    db_session.flush()

    notify_first_salary_claimed(db_session, profile, period_index=1, amount=50_000)
    notify_first_salary_claimed(db_session, profile, period_index=2, amount=50_000)

    rows = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "first_salary_claimed")
        .all()
    )
    assert len(rows) == 1


def test_salary_claimed_emits_first_once(db_session, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: False)
    profile = GameProfile(
        user_id=1,
        name="B",
        save_kind="game",
        period_index=1,
        last_period_salary_claimed=0,
    )
    db_session.add(profile)
    db_session.flush()

    notify_salary_claimed(
        db_session, profile, period_index=1, amount=40_000, first_claim=True
    )
    kinds = [r.kind for r in db_session.query(NotificationLog).all()]
    assert "salary_claimed" in kinds
    assert "first_salary_claimed" in kinds


def test_first_safety_fund_dedupe(db_session, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: False)
    profile = GameProfile(user_id=1, name="C", save_kind="game")
    db_session.add(profile)
    db_session.flush()

    notify_first_safety_fund(
        db_session, profile, period_index=1, amount=1_000, new_safety_fund_balance=1_000
    )
    notify_first_safety_fund(
        db_session, profile, period_index=2, amount=500, new_safety_fund_balance=1_500
    )

    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "first_safety_fund")
        .count()
        == 1
    )


def test_period_closed_includes_economy_payload(db_session, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: False)
    profile = GameProfile(
        user_id=1,
        name="D",
        save_kind="game",
        period_index=2,
        cash_balance=12_000,
        safety_fund_balance=3_000,
    )
    db_session.add(profile)
    db_session.flush()

    notify_period_closed(
        db_session,
        profile,
        closed_period_index=1,
        economy={
            "cash_balance": 12_000,
            "safety_fund_balance": 3_000,
            "total_overdue_amount": 500,
            "net_monthly_cashflow": 1_200,
            "salary_claimed": True,
        },
    )
    row = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "period_closed")
        .one()
    )
    import json

    payload = json.loads(row.payload_json)
    assert payload["cash_balance"] == 12_000
    assert payload["net_monthly_cashflow"] == 1_200

    text = format_alert_message_ru("period_closed", payload)
    assert "12 000" in text
    assert "Поток" in text


def test_player_stuck_heuristic(db_session):
    stale = utc_now_naive() - timedelta(hours=25)
    profile = GameProfile(
        user_id=1,
        name="E",
        save_kind="game",
        is_active=1,
        time_state="play",
        period_index=2,
        updated_at=stale,
    )
    user = User(username="u", hashed_password="x")
    assert is_player_stuck(profile)
    assert profile_stuck_kind(profile, user) == "player_stuck"


def test_onboarding_stuck_heuristic(db_session):
    stale = utc_now_naive() - timedelta(hours=30)
    profile = GameProfile(
        user_id=1,
        name="F",
        save_kind="game",
        is_active=1,
        period_index=1,
        onboarding_state="draft",
        updated_at=stale,
    )
    user = User(username="v", hashed_password="x", guidance_completed=0)
    assert is_onboarding_stuck(profile, user)
    assert profile_stuck_kind(profile, user) == "onboarding_stuck"


def test_player_stuck_emit_dedupe(db_session, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: True)
    stale = utc_now_naive() - timedelta(hours=30)
    profile = GameProfile(
        user_id=1,
        name="G",
        save_kind="game",
        is_active=1,
        time_state="play",
        period_index=1,
        updated_at=stale,
    )
    db_session.add(profile)
    db_session.flush()

    maybe_emit_player_stuck(db_session, profile)
    maybe_emit_player_stuck(db_session, profile)

    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "player_stuck")
        .count()
        == 1
    )
