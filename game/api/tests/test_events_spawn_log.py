"""PR-28 (AI-аудит M1): spawn пишет набор выпавших событий — «почему эта карта» воспроизводимо по логу."""
import logging

from app.game.rules import MIN_PERIOD_INDEX_FOR_GAME_EVENTS
from app.models import EventDefinition, EventInstance, GameProfile
from app.services.events.spawn import ensure_period_events


def _def(db, key):
    d = EventDefinition(key=key, mode="game", title=key, event_tier=1, repeat_policy="repeatable",
                        is_active=1, weight=100)
    db.add(d)
    db.commit()
    return d


def test_spawn_logs_picked_keys_and_pool(db_session, caplog):
    period_index = MIN_PERIOD_INDEX_FOR_GAME_EVENTS
    profile = GameProfile(user_id=1, name="p", save_kind="game", is_active=1, period_index=period_index)
    db_session.add(profile)
    db_session.commit()
    for key in ("log_a", "log_b", "log_c"):
        _def(db_session, key)

    with caplog.at_level(logging.INFO, logger="app.services.events.service"):
        ensure_period_events(db_session, profile.id, period_index, "game")

    picked = {
        key
        for (key,) in db_session.query(EventDefinition.key)
        .join(EventInstance, EventInstance.definition_id == EventDefinition.id)
        .filter(EventInstance.game_profile_id == profile.id)
    }
    assert len(picked) == 2
    records = [r for r in caplog.records if r.getMessage().startswith("events_spawned")]
    assert len(records) == 1
    msg = records[0].getMessage()
    assert f"profile={profile.id}" in msg
    assert f"period={period_index}" in msg
    assert "pool=3" in msg
    for key in picked:
        assert key in msg
