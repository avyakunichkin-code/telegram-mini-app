"""SPEC_needs-set-point шаг 4: закрытие периода с моделью set_point (CS-1, CS-2, CS-4, CS-6)."""

from __future__ import annotations

import json
from unittest.mock import patch

from app.game.period import process_period_end
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, GameStarterTemplate, ProfileExpenseLine
from app.needs.engine import gain_with_headroom
from tests.test_character_needs import _patch_template_needs

_NO_EVENTS = patch("app.game.period.ensure_period_events", return_value=None)
T = 16  # passive_periods_to_zero по умолчанию


def _start_set_point(client, auth_headers, db_session, *, model="set_point") -> GameProfile:
    _patch_template_needs(db_session)
    row = db_session.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == "mq_game_basic_v1").first()
    bp = json.loads(row.blueprint_json)
    bp["needs"]["model"] = model
    row.blueprint_json = json.dumps(bp, ensure_ascii=False)
    db_session.commit()
    r = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={"profile_name": "SP", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert r.status_code == 200, r.text
    return db_session.query(GameProfile).order_by(GameProfile.id.desc()).first()


def _run_idle(db_session, profile, *, max_periods=40, before_close=None):
    """Пассивная игра: только «Завершить ход»; деньги не кончаются (поражение по cash не мешает)."""
    last = None
    with _NO_EVENTS:
        for _ in range(max_periods):
            profile.cash_balance = 10_000_000
            if before_close:
                before_close(profile)
            db_session.commit()
            last = process_period_end(db_session, profile)
            db_session.refresh(profile)
            if last.get("game_over"):
                return int(profile.period_index), last
    return None, last


def test_idle_player_loses_by_needs_around_t(client, auth_headers, db_session):
    """CS-1: пассивный → needs_depletion около T + 2 (3 периода нуля подряд)."""
    profile = _start_set_point(client, auth_headers, db_session)
    lost_at, last = _run_idle(db_session, profile)
    assert last["defeat_reason"] == "needs_depletion", last
    closed = lost_at - 1  # period_index уже увеличен после закрытия
    assert abs(closed - (T + 2)) <= 2, closed
    assert last["needs"]["model"] == "set_point"
    assert set(last["needs"]["level"]) == {"comfort", "status", "social", "health"}


def test_cut_leisure_loses_earlier(client, auth_headers, db_session):
    """CS-2: урезанный досуг (social L ниже) → поражение раньше пассивного."""
    base_profile = _start_set_point(client, auth_headers, db_session)
    lost_base, _ = _run_idle(db_session, base_profile)

    profile = _start_set_point(client, auth_headers, db_session)
    for line in db_session.query(ProfileExpenseLine).filter(
        ProfileExpenseLine.game_profile_id == profile.id, ProfileExpenseLine.category_key == "leisure"
    ):
        line.amount_monthly = 0
    db_session.commit()
    lost_cut, last = _run_idle(db_session, profile)
    assert last["defeat_reason"] == "needs_depletion"
    assert lost_cut < lost_base


def test_overdue_stress_loses_earlier(client, auth_headers, db_session, monkeypatch):
    """CS-4: просрочка снижает L comfort → поражение раньше.

    В закрытии периода долг гасится до расчёта L, а в тесте денег много — поэтому флаг
    просрочки держим подменой (сам стрессор проверен в test_needs_set_point_overview).
    """
    base_profile = _start_set_point(client, auth_headers, db_session)
    lost_base, _ = _run_idle(db_session, base_profile)

    profile = _start_set_point(client, auth_headers, db_session)
    monkeypatch.setattr(
        "app.needs.set_point._stress_flags", lambda db, p: {"overdue": True, "negative_cash": False}
    )
    lost_stress, last = _run_idle(db_session, profile)
    assert last["defeat_reason"] == "needs_depletion"
    assert lost_stress < lost_base


def test_linear_model_keeps_old_decay(client, auth_headers, db_session):
    """CS-6: шаблон без model → прежний линейный decay (initial / periods_to_empty_target)."""
    profile = _start_set_point(client, auth_headers, db_session, model="linear")
    before = profile.need_comfort
    with _NO_EVENTS:
        profile.cash_balance = 10_000_000
        db_session.commit()
        res = process_period_end(db_session, profile)
    db_session.refresh(profile)
    assert res["needs"]["model"] == "linear"
    assert "level" not in res["needs"]
    assert profile.need_comfort == round(before - 72 / 12, 1)


def test_gain_with_headroom():
    assert gain_with_headroom(0, 10) == 10
    assert gain_with_headroom(80, 10) == 2.5  # не меньше 25%
    assert gain_with_headroom(50, 10) == 5
    assert gain_with_headroom(90, -4) == -4


def test_time_next_returns_needs_block(client, auth_headers, db_session):
    """NV-404: ответ «Завершить ход» содержит потребности до/после, уровень и износ."""
    profile = _start_set_point(client, auth_headers, db_session)
    profile.cash_balance = 10_000_000
    db_session.commit()
    with _NO_EVENTS:
        r = client.post("/api/game/time/next", headers=auth_headers)
    assert r.status_code == 200, r.text
    needs = r.json()["period_close"]["needs"]
    assert needs["model"] == "set_point"
    assert needs["after"]["comfort"] < needs["before"]["comfort"]
    assert needs["level"] and needs["wear"]


def test_choose_event_applies_headroom_on_set_point(client, auth_headers, db_session):
    """Ревью шага 4: через API плюс урезается «запасом до 100», минус — нет."""
    profile = _start_set_point(client, auth_headers, db_session)
    profile.need_social = 80.0
    profile.need_health = 50.0
    profile.need_comfort = 60.0
    ed = EventDefinition(key="test_headroom_evt", mode="any", title="Тест", is_active=1, weight=100)
    db_session.add(ed)
    db_session.flush()
    choice = EventChoice(
        definition_id=ed.id,
        title="Встреча",
        effects_json=json.dumps({"cash_delta": 0, "needs_delta": {"social": 10, "health": 10, "comfort": -4}}),
    )
    db_session.add(choice)
    db_session.flush()
    inst = EventInstance(game_profile_id=profile.id, definition_id=ed.id, period_index=int(profile.period_index), status="pending")
    db_session.add(inst)
    db_session.commit()

    res = client.post(f"/api/game/events/{inst.id}/choose", headers=auth_headers, json={"choice_id": choice.id})
    assert res.status_code == 200, res.text
    db_session.refresh(profile)
    assert profile.need_social == 82.5  # 10 × 0.25
    assert profile.need_health == 55.0  # 10 × 0.5
    assert profile.need_comfort == 56.0  # минус без множителя


def test_treat_self_applies_headroom_on_set_point(client, auth_headers, db_session):
    profile = _start_set_point(client, auth_headers, db_session)
    profile.need_social = 80.0
    profile.cash_balance = 100_000
    db_session.commit()
    res = client.post("/api/game/period/treat-self", headers=auth_headers, json={"option_id": "picnic_friends"})
    assert res.status_code == 200, res.text
    db_session.refresh(profile)
    assert profile.need_social == 85.5  # 22 × 0.25
