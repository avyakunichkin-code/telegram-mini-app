"""Фабрики EventDefinition / EventInstance для тестов choose."""

from __future__ import annotations

import json

from app.models import EventChoice, EventDefinition, EventInstance


def seed_cash_delta_event(
    db,
    profile_id: int,
    *,
    period_index: int,
    cash_delta: float,
    key: str = "test_cash_property",
) -> tuple[EventInstance, EventChoice]:
    definition = EventDefinition(
        key=key,
        mode="any",
        title="Cash property test",
        is_active=1,
        weight=100,
    )
    db.add(definition)
    db.flush()

    choice = EventChoice(
        definition_id=definition.id,
        title="Apply cash delta",
        effects_json=json.dumps({"cash_delta": cash_delta}, ensure_ascii=False),
    )
    db.add(choice)
    db.flush()

    instance = EventInstance(
        game_profile_id=profile_id,
        definition_id=definition.id,
        period_index=period_index,
        status="pending",
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    db.refresh(choice)
    return instance, choice
