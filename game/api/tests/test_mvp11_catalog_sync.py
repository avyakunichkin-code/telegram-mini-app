"""ensure_mvp11_event_catalog: upsert существующих keys при расхождении с сидами."""

import json

from app.events.mvp11_seeds import (
    MVP11_EVENT_SPECS,
    _mvp11_catalog_in_sync,
    ensure_mvp11_event_catalog,
)
from app.models import EventChoice, EventDefinition


def _spec_by_key(key: str) -> dict:
    for spec in MVP11_EVENT_SPECS:
        if spec["key"] == key:
            return spec
    raise KeyError(key)


def test_ensure_mvp11_updates_existing_definition_from_seeds(db_session):
    key = "mq11_friend_outing_student"
    ensure_mvp11_event_catalog(db_session)
    assert _mvp11_catalog_in_sync(db_session)

    row = db_session.query(EventDefinition).filter(EventDefinition.key == key).first()
    assert row is not None
    row.title = "Устаревший заголовок в БД"
    db_session.commit()

    assert not _mvp11_catalog_in_sync(db_session)

    ensure_mvp11_event_catalog(db_session)
    db_session.refresh(row)

    assert row.title == _spec_by_key(key)["title"]
    assert _mvp11_catalog_in_sync(db_session)


def test_ensure_mvp11_updates_choice_effects(db_session):
    key = "mq11_friend_outing_student"
    ensure_mvp11_event_catalog(db_session)

    row = db_session.query(EventDefinition).filter(EventDefinition.key == key).first()
    choice = (
        db_session.query(EventChoice)
        .filter(EventChoice.definition_id == row.id)
        .order_by(EventChoice.id.asc())
        .first()
    )
    choice.effects_json = json.dumps({"cash_delta": -999999}, ensure_ascii=False)
    db_session.commit()

    ensure_mvp11_event_catalog(db_session)
    db_session.refresh(choice)

    expected = _spec_by_key(key)["choices"][0]["effects"]
    assert json.loads(choice.effects_json) == expected
