"""MQ-116: отбор событий — tier-окно, cooldown, repeat_policy."""

from app.models import EventDefinition, EventInstance, EventProfileCounter, GameProfile
from app.routers.events import ensure_period_events


def _add_def(db, key: str, *, tier: int = 1, cooldown: int = 0, repeat_policy: str = "repeatable"):
    d = EventDefinition(
        key=key,
        mode="game",
        title=key,
        event_tier=tier,
        cooldown_periods=cooldown,
        repeat_policy=repeat_policy,
        is_active=1,
        weight=100,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


class TestEnsurePeriodEvents:
    def test_picks_only_tier_in_window_for_level_1(self, db_session):
        profile = GameProfile(user_id=1, name="p", save_kind="game", is_active=1, level=1, period_index=1)
        db_session.add(profile)
        db_session.commit()

        in_window = _add_def(db_session, "tier1_a", tier=1)
        _add_def(db_session, "tier5_far", tier=5)

        ensure_period_events(db_session, profile.id, 1, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 1)
            .all()
        )
        def_ids = {i.definition_id for i in instances}
        assert in_window.id in def_ids
        assert all(
            db_session.query(EventDefinition).filter(EventDefinition.id == did).first().event_tier <= 1
            for did in def_ids
        )

    def test_cooldown_excludes_recent_event(self, db_session):
        profile = GameProfile(user_id=1, name="p2", save_kind="game", is_active=1, level=3, period_index=3)
        db_session.add(profile)
        db_session.commit()

        cooled = _add_def(db_session, "cool_evt", tier=2, cooldown=2)
        _add_def(db_session, "other_evt", tier=2)

        db_session.add(
            EventProfileCounter(
                game_profile_id=profile.id,
                definition_id=cooled.id,
                times_selected=1,
                last_selected_period_index=2,
            )
        )
        db_session.commit()

        ensure_period_events(db_session, profile.id, 3, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 3)
            .all()
        )
        picked_ids = {i.definition_id for i in instances}
        assert cooled.id not in picked_ids

    def test_once_per_profile_never_repeats(self, db_session):
        profile = GameProfile(user_id=1, name="p3", save_kind="game", is_active=1, level=2, period_index=2)
        db_session.add(profile)
        db_session.commit()

        once = _add_def(db_session, "once_evt", tier=1, repeat_policy="once_per_profile")
        _add_def(db_session, "repeat_evt", tier=1)

        db_session.add(
            EventProfileCounter(
                game_profile_id=profile.id,
                definition_id=once.id,
                times_selected=1,
                last_selected_period_index=1,
            )
        )
        db_session.commit()

        ensure_period_events(db_session, profile.id, 2, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 2)
            .all()
        )
        assert once.id not in {i.definition_id for i in instances}
