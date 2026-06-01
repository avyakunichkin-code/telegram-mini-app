"""A3 Profile inspector API."""

from app.admin.notify import emit_admin_alert
from app.models import GameProfile, PeriodEconomyClosing


def test_admin_profile_inspector_not_found(client, admin_env, auth_headers):
    resp = client.get("/api/admin/profiles/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_admin_profile_inspector_ok(client, admin_env, auth_headers, db_session, seed_basic_template):
    start = client.post(
        "/api/game/start",
        json={
            "profile_name": "Inspector Test",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    assert start.status_code == 200
    profile_id = start.json()["profile_id"]

    emit_admin_alert(
        db_session,
        "game_started",
        {"template": "mq_game_basic_v1"},
        game_profile_id=profile_id,
        user_id=admin_env.id,
        dedupe_key=f"test:started:{profile_id}",
    )

    db_session.add(
        PeriodEconomyClosing(
            game_profile_id=profile_id,
            period_index=1,
            cash_balance=12000,
            safety_fund_balance=3000,
            total_overdue_amount=0,
            monthly_burn_total=37500,
            period_income_rate=50000,
            period_expense_total=40000,
            total_debt_balance=0,
        )
    )
    db_session.commit()

    resp = client.get(f"/api/admin/profiles/{profile_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["profile"]["id"] == profile_id
    assert data["profile"]["name"] == "Inspector Test"
    assert data["user"]["username"] == admin_env.username
    assert "win_reached" in data["economy"]
    assert len(data["period_closings"]) == 1
    assert data["period_closings"][0]["period_index"] == 1
    assert len(data["activity_log"]) >= 1
    assert any(row["kind"] == "game_started" for row in data["activity_log"])


def test_admin_profile_inspector_forbidden(client, auth_headers, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", "")
    from app.config import config

    config.ADMIN_USER_IDS = set()
    resp = client.get("/api/admin/profiles/1", headers=auth_headers)
    assert resp.status_code == 403
