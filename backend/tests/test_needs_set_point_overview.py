"""CS-9 (+CS-3, CS-4 на уровне overview): уровень жизни и износ в /api/finance/overview."""

from __future__ import annotations

from app.finance.expenses import add_expense_line_from_event
from app.models import FinanceLiability, GameProfile

from tests.test_character_needs import _patch_template_needs


def _start(client, auth_headers, db_session, template_key="mq_game_basic_v1"):
    # В тестовой БД у шаблона нет блока needs — подставляем как в test_character_needs.
    _patch_template_needs(db_session, template_key)
    r = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={"profile_name": "Level", "save_kind": "game", "template_key": template_key},
    )
    assert r.status_code == 200, r.text


def _meta(client, auth_headers):
    ov = client.get("/api/finance/overview", headers=auth_headers)
    assert ov.status_code == 200, ov.text
    return ov.json()["needs_meta"]


def _profile(db_session) -> GameProfile:
    return db_session.query(GameProfile).order_by(GameProfile.id.desc()).first()


def test_overview_exposes_level_wear_and_idle_forecast(client, auth_headers, db_session):
    _start(client, auth_headers, db_session)
    meta = _meta(client, auth_headers)
    assert meta["model"] == "linear"
    for key in ("level", "wear"):
        assert set(meta[key]) == {"comfort", "status", "social", "health"}
    assert all(v > 0 for v in meta["wear"].values())
    # Бюджет шаблона = норма → уровень равен базе (0.8 · initial), источников нет.
    assert meta["level_sources"] == []
    # Модель linear: прогноз по текущему decay, у каждой оси есть срок.
    assert all(isinstance(v, int) and v > 0 for v in meta["periods_to_zero_if_idle"].values())


def test_event_expense_line_raises_social_level(client, auth_headers, db_session):
    _start(client, auth_headers, db_session)
    social_before = _meta(client, auth_headers)["level"]["social"]

    profile = _profile(db_session)
    add_expense_line_from_event(
        db_session, profile, category_key="communications", amount_monthly=2500, title="Стриминг", source_ref="test"
    )
    db_session.commit()

    meta = _meta(client, auth_headers)
    assert meta["level"]["social"] > social_before
    assert any(s["source"] == "budget" and s["kind"] == "communications" for s in meta["level_sources"])


def test_overdue_liability_adds_stressor(client, auth_headers, db_session):
    _start(client, auth_headers, db_session)
    comfort_before = _meta(client, auth_headers)["level"]["comfort"]

    profile = _profile(db_session)
    db_session.add(
        FinanceLiability(
            game_profile_id=profile.id,
            title="Кредитка",
            total_debt=10_000,
            annual_rate_percent=20,
            monthly_payment=1_000,
            overdue_amount=1_000,
            overdue_periods=1,
        )
    )
    db_session.commit()

    meta = _meta(client, auth_headers)
    assert meta["level"]["comfort"] == comfort_before - 10
    assert any(s["source"] == "stress" and s["kind"] == "overdue" for s in meta["level_sources"])


def test_overview_survives_level_failure(client, auth_headers, db_session, monkeypatch):
    _start(client, auth_headers, db_session)

    def boom(*a, **k):
        raise RuntimeError("level failed")

    monkeypatch.setattr("app.finance.overview_build.build_set_point_snapshot", boom)
    meta = _meta(client, auth_headers)
    assert meta["level"] is None and meta["wear"] is None
    assert meta["level_sources"] == []


def test_new_asset_bonus_uses_acquired_period(client, auth_headers, db_session):
    """NV-304: свежая покупка даёт полный вклад, старая — с привыканием."""
    from app.models import FinanceAsset

    _start(client, auth_headers, db_session)
    profile = _profile(db_session)
    profile.period_index = 30
    car = FinanceAsset(
        game_profile_id=profile.id, title="Авто", kind="car_personal", asset_value=300_000,
        monthly_maintenance_cost=0, monthly_income=0, acquired_period_index=30,
    )
    db_session.add(car)
    db_session.commit()
    fresh = sum(s["delta"] for s in _meta(client, auth_headers)["level_sources"] if s["source"] == "asset")

    car.acquired_period_index = 1
    db_session.commit()
    old = sum(s["delta"] for s in _meta(client, auth_headers)["level_sources"] if s["source"] == "asset")
    assert fresh > old > 0
