"""Сценарное событие «открытие колоды» — intro в первом периоде."""

from app.models import EventDefinition, EventInstance, GameProfile, User
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.routers.events import (
    EVENTS_UNLOCK_INTRO_KEY,
    ensure_events_unlock_intro,
    ensure_period_events,
)


class TestEventsUnlockIntro:
    def test_spawns_once_not_in_random_pool(self, db_session):
        ensure_mvp11_event_catalog(db_session)

        profile = GameProfile(
            user_id=1,
            name="intro",
            save_kind="game",
            is_active=1,
            period_index=1,
        )
        db_session.add(profile)
        db_session.commit()

        ensure_events_unlock_intro(db_session, profile)
        ensure_period_events(db_session, profile.id, 1, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 1)
            .all()
        )
        intro_def = (
            db_session.query(EventDefinition)
            .filter(EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY)
            .first()
        )
        assert intro_def is not None
        intro_instances = [i for i in instances if i.definition_id == intro_def.id]
        assert len(intro_instances) == 1

        ensure_events_unlock_intro(db_session, profile)
        intro_instances = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.definition_id == intro_def.id,
            )
            .all()
        )
        assert len(intro_instances) == 1

        random_defs = {
            db_session.query(EventDefinition).filter(EventDefinition.id == i.definition_id).first().key
            for i in instances
            if i.definition_id != intro_def.id
        }
        assert EVENTS_UNLOCK_INTRO_KEY not in random_defs
        assert len(instances) == 1 + len(random_defs)

    def test_skipped_while_o2_guidance_incomplete(self, db_session):
        ensure_mvp11_event_catalog(db_session)

        user = User(
            username="o2_intro",
            hashed_password="x",
            guidance_completed=0,
        )
        db_session.add(user)
        db_session.commit()

        profile = GameProfile(
            user_id=user.id,
            name="o2",
            save_kind="game",
            is_active=1,
            period_index=2,
        )
        db_session.add(profile)
        db_session.commit()

        ensure_events_unlock_intro(db_session, profile)

        intro_def = (
            db_session.query(EventDefinition)
            .filter(EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY)
            .first()
        )
        assert intro_def is not None
        count = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.definition_id == intro_def.id,
            )
            .count()
        )
        assert count == 0
