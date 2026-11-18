"""Подсказка о дыре в бюджете + ранняя A1 (PO 2026-10-22, экономика Предпринимателя).

При отрицательном месячном потоке в первом периоде с событиями оба слота занимают
mq11_cashflow_warning (с числами из профиля) и mq11_second_car_offer (если машин 2+).
"""

from __future__ import annotations

import pytest

from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.finance.cashflow import monthly_flow
from app.game.rules import MIN_PERIOD_INDEX_FOR_GAME_EVENTS
from app.models import EventDefinition, EventInstance, FinanceAsset, FinanceSalary, GameProfile
from app.services.events.spawn import ensure_period_events


def _profile(db_session, test_user, *, burn: float, cars: int) -> GameProfile:
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="flow",
        save_kind="game",
        starter_template_key="mq_game_debt_stack_v1",
        is_active=1,
        period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS,
        cash_balance=45_000,
        safety_fund_balance=0,
        base_monthly_lifestyle_expense=burn,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=200_000))
    db_session.add(FinanceAsset(game_profile_id=profile.id, title="Квартира", kind="home",
                                asset_value=10_000_000, monthly_maintenance_cost=30_000, is_active=1))
    for i in range(cars):
        db_session.add(FinanceAsset(game_profile_id=profile.id, title=f"Машина {i + 1}", kind="car_personal",
                                    asset_value=1_200_000, monthly_maintenance_cost=18_000, is_active=1))
    db_session.commit()
    return profile


def _spawned_keys(db_session, profile: GameProfile) -> set[str]:
    rows = (
        db_session.query(EventDefinition.key)
        .join(EventInstance, EventInstance.definition_id == EventDefinition.id)
        .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == profile.period_index)
        .all()
    )
    return {r.key for r in rows}


def test_negative_flow_spawns_warning_and_second_car_first(db_session, test_user):
    # 200 000 − (30 000 + 2×18 000 + 140 000 жизни) = −6 000
    profile = _profile(db_session, test_user, burn=140_000, cars=2)
    assert monthly_flow(db_session, profile).net == pytest.approx(-6_000)

    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")
    assert _spawned_keys(db_session, profile) == {"mq11_cashflow_warning", "mq11_second_car_offer"}


def test_positive_flow_no_warning_and_random_pool(db_session, test_user):
    profile = _profile(db_session, test_user, burn=60_000, cars=2)
    assert monthly_flow(db_session, profile).net > 0

    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")
    keys = _spawned_keys(db_session, profile)
    assert "mq11_cashflow_warning" not in keys
    assert len(keys) == 2


def test_warning_description_has_numbers(client, auth_headers, db_session, test_user):
    profile = _profile(db_session, test_user, burn=164_000, cars=1)
    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")

    resp = client.get("/api/game/events/pending", headers=auth_headers)
    events = resp.json().get("events") or []
    warning = next((e for e in events if e.get("key") == "mq11_cashflow_warning"), None)
    assert warning is not None, resp.text[:500]
    text = warning["description"]
    assert "{" not in text
    assert "12 000 ₽" in text  # 200 000 − (30 000 + 18 000 + 164 000) = −12 000
    assert "примерно на 3 пер." in text  # 45 000 / 12 000


def test_skipped_priority_event_does_not_repeat(db_session, test_user):
    """Ревью: пропущенная подсказка истекает и больше не занимает слоты — в следующем периоде случайная колода."""
    from app.services.events.spawn import expire_pending_events_for_closed_period

    profile = _profile(db_session, test_user, burn=140_000, cars=2)
    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")
    assert _spawned_keys(db_session, profile) == {"mq11_cashflow_warning", "mq11_second_car_offer"}

    expire_pending_events_for_closed_period(db_session, profile.id, int(profile.period_index))
    profile.period_index = int(profile.period_index) + 1
    db_session.commit()
    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")
    keys = _spawned_keys(db_session, profile)
    assert len(keys) == 2
    assert not keys & {"mq11_cashflow_warning", "mq11_second_car_offer"}


def test_warning_text_when_gap_closed(client, auth_headers, db_session, test_user):
    profile = _profile(db_session, test_user, burn=164_000, cars=1)
    ensure_period_events(db_session, profile.id, int(profile.period_index), "game")
    car = db_session.query(FinanceAsset).filter(FinanceAsset.game_profile_id == profile.id,
                                                FinanceAsset.kind == "car_personal").first()
    car.is_active = 0  # продали в этом же периоде — дыры больше нет
    db_session.commit()
    events = client.get("/api/game/events/pending", headers=auth_headers).json().get("events") or []
    warning = next(e for e in events if e.get("key") == "mq11_cashflow_warning")
    assert "уже в плюсе" in warning["description"]
