"""PLT-101: product funnel в Watchtower."""

from __future__ import annotations

from app.admin.product_funnel import build_product_funnel
from app.models import GameProfile, PeriodEconomyClosing
from tests.fixtures.game import create_game_profile


def _add_closes(db_session, profile_id: int, n: int) -> None:
    for i in range(1, n + 1):
        db_session.add(
            PeriodEconomyClosing(
                game_profile_id=profile_id,
                period_index=i,
                cash_balance=1000.0,
                safety_fund_balance=0.0,
            )
        )
    db_session.commit()


def test_product_funnel_in_watchtower(client, admin_env, auth_headers, db_session, test_user):
    game = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Game funnel",
        save_kind="game",
    )
    _add_closes(db_session, game.id, 5)

    resp = client.get("/api/admin/watchtower?funnel_days=30", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "product_funnel" in data
    funnel = data["product_funnel"]
    assert funnel["window_days"] == 30
    assert len(funnel["steps"]) == 8
    assert funnel["activation"]["pct_ge5_closes"] >= 100.0
    assert len(funnel["by_save_kind"]) == 2
    assert data["metrics_summary"].get("save_kind") is None


def test_product_funnel_save_kind_filter(client, admin_env, auth_headers, db_session, test_user):
    game = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Game only",
        save_kind="game",
    )
    plan = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Plan only",
        save_kind="plan",
    )
    _add_closes(db_session, game.id, 3)
    _add_closes(db_session, plan.id, 6)

    resp = client.get(
        "/api/admin/watchtower?save_kind=plan&funnel_days=30",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    funnel = resp.json()["product_funnel"]
    assert funnel["save_kind"] == "plan"
    assert funnel["activation"]["profiles_cohort"] == 1
    assert funnel["activation"]["pct_ge5_closes"] == 100.0

    profiles = resp.json()["profiles"]
    assert profiles
    assert all(p["save_kind"] == "plan" for p in profiles)


def test_metrics_summary_save_kind(client, admin_env, auth_headers, db_session, test_user):
    create_game_profile(db_session, user_id=test_user.id, name="G1", save_kind="game")
    create_game_profile(db_session, user_id=test_user.id, name="P1", save_kind="plan")

    resp = client.get("/api/admin/metrics/summary?days=30&save_kind=plan", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["save_kind"] == "plan"
    assert data["profiles_total"] == 1


def test_build_product_funnel_empty(db_session):
    funnel = build_product_funnel(db_session, days=7)
    assert funnel["activation"]["profiles_cohort"] == 0
    assert funnel["steps"][0]["step"] == "users_registered"
