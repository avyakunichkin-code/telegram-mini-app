"""Admin/ops: порядок записи алерта и Telegram, фоновый stuck-скан, 422 в каталогах, CSV-инъекции, изоляция config."""

from __future__ import annotations

import csv
import io
from datetime import timedelta

from sqlalchemy.orm import sessionmaker

from app.admin.csv_export import csv_safe_cell
from app.admin.notify import emit_admin_alert
from app.admin.stuck_scan import run_stuck_scan_in_background
from app.config import config
from app.models import LiabilityTemplate, NotificationLog
from app.timeutil import utc_now_naive
from tests.fixtures.game import create_game_profile

# Снимок до любых тестов (импорт модулей — на этапе сбора): admin_env не должен его менять насовсем.
_ADMIN_USER_IDS_AT_IMPORT = set(config.ADMIN_USER_IDS)
_OPS_TOKEN_AT_IMPORT = config.OPS_TELEGRAM_BOT_TOKEN


def _enable_telegram(monkeypatch) -> list[bool]:
    """Включить Telegram в config; вернуть список, куда пишется «была ли строка лога в БД на момент отправки»."""
    monkeypatch.setattr(config, "OPS_TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setattr(config, "OPS_TELEGRAM_CHAT_ID", "1")
    return []


def test_emit_admin_alert_persists_row_before_telegram(db_session, monkeypatch):
    seen_row_at_send: list[bool] = _enable_telegram(monkeypatch)

    def fake_send(_text: str) -> bool:
        exists = (
            db_session.query(NotificationLog)
            .filter(NotificationLog.dedupe_key == "order:1")
            .first()
            is not None
        )
        seen_row_at_send.append(exists)
        return True

    monkeypatch.setattr("app.admin.notify._send_telegram_message", fake_send)

    row = emit_admin_alert(db_session, "player_stuck", {"name": "x"}, dedupe_key="order:1")

    assert seen_row_at_send == [True]
    assert row is not None
    db_session.expire_all()
    stored = db_session.query(NotificationLog).filter(NotificationLog.dedupe_key == "order:1").one()
    assert stored.telegram_sent == 1


def test_emit_admin_alert_dedupe_race_skips_telegram_and_rolls_back(
    db_session, db_engine, test_user, monkeypatch
):
    """Другой запрос записал тот же dedupe_key между проверкой и insert → без Telegram, сессия жива."""
    _enable_telegram(monkeypatch)
    sent: list[str] = []
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda text: sent.append(text) or True)

    other_session = sessionmaker(bind=db_engine)
    original_admin_link = __import__("app.admin.notify", fromlist=["_admin_link"])._admin_link

    def racing_admin_link(path: str) -> str:
        with other_session() as other:
            other.add(NotificationLog(audience="admin", kind="player_stuck", dedupe_key="race:1"))
            other.commit()
        return original_admin_link(path)

    monkeypatch.setattr("app.admin.notify._admin_link", racing_admin_link)

    row = emit_admin_alert(
        db_session, "player_stuck", {"name": "x"}, user_id=test_user.id, dedupe_key="race:1"
    )

    assert row is None
    assert sent == []
    # Без rollback здесь был бы PendingRollbackError.
    assert db_session.query(NotificationLog).filter(NotificationLog.dedupe_key == "race:1").count() == 1


def test_watchtower_schedules_stuck_scan_in_background(
    client, admin_env, auth_headers, db_session, test_user, monkeypatch
):
    profile = create_game_profile(db_session, user_id=test_user.id, name="Visible")
    scheduled: list[list[int]] = []
    monkeypatch.setattr(
        "app.routers.admin.run_stuck_scan_in_background", lambda ids: scheduled.append(list(ids))
    )

    resp = client.get("/api/admin/watchtower", headers=auth_headers)

    assert resp.status_code == 200
    assert scheduled == [[profile.id]]


def test_background_stuck_scan_uses_own_session(db_session, db_engine, test_user, monkeypatch):
    monkeypatch.setattr("app.admin.notify._send_telegram_message", lambda _t: True)
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Stale",
        period_index=2,
        updated_at=utc_now_naive() - timedelta(hours=30),
    )

    run_stuck_scan_in_background([profile.id], session_factory=sessionmaker(bind=db_engine))

    db_session.expire_all()
    kinds = {
        n.kind
        for n in db_session.query(NotificationLog).filter(NotificationLog.game_profile_id == profile.id)
    }
    assert "player_stuck" in kinds


def test_catalog_patch_invalid_number_returns_422(client, admin_env, auth_headers, db_session):
    row = LiabilityTemplate(
        template_key="patch_bad_number",
        title="Before",
        total_debt=50_000,
        annual_rate_percent=10,
        is_active=1,
        sort_order=1,
    )
    db_session.add(row)
    db_session.commit()

    resp = client.patch(
        f"/api/admin/catalogs/liabilities/rows/{row.id}",
        json={"title": "After", "total_debt": "много", "sort_order": "1.5"},
        headers=auth_headers,
    )

    assert resp.status_code == 422
    errors = resp.json()["detail"]["errors"]
    assert set(errors) == {"total_debt", "sort_order"}
    db_session.expire_all()
    assert db_session.get(LiabilityTemplate, row.id).title == "Before"


def test_csv_safe_cell_neutralizes_formulas():
    assert csv_safe_cell("=HYPERLINK(\"http://x\")") == "'=HYPERLINK(\"http://x\")"
    for prefix in ("+", "-", "@", "\t", "\r"):
        assert csv_safe_cell(f"{prefix}1+1") == f"'{prefix}1+1"
    assert csv_safe_cell("Обычное имя") == "Обычное имя"
    assert csv_safe_cell(-500.0) == -500.0


def test_profiles_csv_escapes_formula_in_name(client, admin_env, auth_headers, db_session, test_user):
    create_game_profile(db_session, user_id=test_user.id, name="=1+2", cash_balance=-500.0)

    resp = client.get("/api/admin/export/profiles.csv?limit=10", headers=auth_headers)

    assert resp.status_code == 200
    rows = list(csv.reader(io.StringIO(resp.text)))
    header, body = rows[0], rows[1:]
    record = next(r for r in body if r[header.index("name")].endswith("=1+2"))
    assert record[header.index("name")] == "'=1+2"
    assert record[header.index("cash_balance")] == "-500.0"


def test_admin_env_sets_allowlist(admin_env):
    assert config.ADMIN_USER_IDS == {admin_env.id}


def test_admin_env_does_not_leak_into_next_test():
    """Идёт после test_admin_env_sets_allowlist: monkeypatch вернул config как был."""
    assert config.ADMIN_USER_IDS == _ADMIN_USER_IDS_AT_IMPORT
    assert config.OPS_TELEGRAM_BOT_TOKEN == _OPS_TOKEN_AT_IMPORT
