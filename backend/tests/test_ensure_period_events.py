"""MQ-116: отбор событий — tier-окно по period_index, cooldown, repeat_policy."""

from app.models import EventDefinition, EventInstance, EventProfileCounter, FinanceAsset, GameProfile
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.routers.events import EVENTS_PER_PERIOD, ensure_period_events


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
    def test_period_1_picks_only_tier1_in_window(self, db_session):
        profile = GameProfile(user_id=1, name="p", save_kind="game", is_active=1, period_index=1)
        db_session.add(profile)
        db_session.commit()

        in_window = _add_def(db_session, "tier1_a", tier=1)
        _add_def(db_session, "tier1_b", tier=1)
        _add_def(db_session, "tier5_far", tier=5)

        ensure_period_events(db_session, profile.id, 1, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 1)
            .all()
        )
        def_ids = {i.definition_id for i in instances}
        assert len(def_ids) == EVENTS_PER_PERIOD
        assert in_window.id in def_ids
        assert all(
            db_session.query(EventDefinition).filter(EventDefinition.id == did).first().event_tier <= 1
            for did in def_ids
        )

    def test_period_11_allows_tier2_not_tier3(self, db_session):
        profile = GameProfile(user_id=1, name="p11", save_kind="game", is_active=1, period_index=11)
        db_session.add(profile)
        db_session.commit()

        _add_def(db_session, "tier1_evt", tier=1)
        tier2 = _add_def(db_session, "tier2_evt", tier=2)
        _add_def(db_session, "tier3_far", tier=3)

        ensure_period_events(db_session, profile.id, 11, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 11)
            .all()
        )
        def_ids = {i.definition_id for i in instances}
        assert len(def_ids) == EVENTS_PER_PERIOD
        tiers = [
            db_session.query(EventDefinition).filter(EventDefinition.id == did).first().event_tier
            for did in def_ids
        ]
        assert tier2.id in def_ids
        assert all(t <= 2 for t in tiers)

    def test_cooldown_excludes_recent_event(self, db_session):
        profile = GameProfile(user_id=1, name="p2", save_kind="game", is_active=1, period_index=11)
        db_session.add(profile)
        db_session.commit()

        cooled = _add_def(db_session, "cool_evt", tier=2, cooldown=2)
        _add_def(db_session, "other_evt", tier=2)

        db_session.add(
            EventProfileCounter(
                game_profile_id=profile.id,
                definition_id=cooled.id,
                times_selected=1,
                last_selected_period_index=10,
            )
        )
        db_session.commit()

        ensure_period_events(db_session, profile.id, 11, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 11)
            .all()
        )
        picked_ids = {i.definition_id for i in instances}
        assert cooled.id not in picked_ids

    def test_once_per_profile_never_repeats(self, db_session):
        profile = GameProfile(user_id=1, name="p3", save_kind="game", is_active=1, period_index=2)
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

    def test_car_accident_not_drawn_without_car_asset(self, db_session):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(user_id=1, name="no-car", save_kind="game", is_active=1, period_index=2)
        db_session.add(profile)
        db_session.commit()

        for i in range(6):
            _add_def(db_session, f"generic_evt_{i}", tier=1)

        ensure_period_events(db_session, profile.id, 2, "game")

        dtp = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_car_accident").first()
        assert dtp is not None
        instances = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == 2,
            )
            .all()
        )
        assert dtp.id not in {i.definition_id for i in instances}

    def test_car_accident_eligible_with_car_asset(self, db_session):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(user_id=1, name="has-car", save_kind="game", is_active=1, period_index=21)
        db_session.add(profile)
        db_session.commit()
        db_session.add(
            FinanceAsset(
                game_profile_id=profile.id,
                title="Машина",
                kind="car_personal",
                asset_value=1_000_000,
                is_active=1,
            )
        )
        db_session.commit()

        dtp = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_car_accident").first()
        for row in db_session.query(EventDefinition).filter(EventDefinition.is_active == 1).all():
            if row.key != "mq11_car_accident":
                row.is_active = 0
        db_session.commit()

        ensure_period_events(db_session, profile.id, 21, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == 21,
            )
            .all()
        )
        assert dtp.id in {i.definition_id for i in instances}
