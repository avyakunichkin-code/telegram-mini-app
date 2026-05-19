"""
MQ-116 (приёмка MVP 1.1): сиды на чистой БД, контракт tier/cooldown/XP, интеграция API.
См. SPEC_mvp-11-progression-events §9.2, §13; PLAN_mvp-11 шаг MQ-116.
"""

from __future__ import annotations

import json

import pytest
from sqlalchemy import or_

from app.game_rules import event_tier_in_core_window
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile
from app.mvp11_catalog_contract import validate_mvp11_db_catalog, validate_mvp11_specs
from app.mvp11_event_seeds import MVP11_EVENT_SPECS, ensure_mvp11_event_catalog
from app.routers.events import (
    EVENTS_PER_PERIOD,
    ensure_period_events,
    expire_pending_events_for_closed_period,
)


MQ11_KEYS = {s["key"] for s in MVP11_EVENT_SPECS}


class TestMvp11CatalogContract:
    def test_specs_meet_spec_section_9_2(self):
        validate_mvp11_specs(MVP11_EVENT_SPECS)

    def test_catalog_on_clean_db(self, db_session):
        validate_mvp11_db_catalog(db_session, mq11_keys=MQ11_KEYS)


class TestEnsurePeriodEventsAcceptance:
    """Дополнение к test_ensure_period_events: окна L=2, L=7 (SPEC §13)."""

    def _add_def(self, db, key: str, *, tier: int = 1, cooldown: int = 0, repeat_policy: str = "repeatable"):
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

    @pytest.mark.parametrize(
        "level, period_index, allowed_tiers",
        [
            (2, 1, {1, 2}),
            (7, 3, {5, 6, 7}),
        ],
    )
    def test_core_tier_window(self, db_session, level, period_index, allowed_tiers):
        profile = GameProfile(
            user_id=1,
            name="tier-window",
            save_kind="game",
            is_active=1,
            level=level,
            period_index=period_index,
        )
        db_session.add(profile)
        db_session.commit()

        if level == 2:
            for i in range(4):
                self._add_def(db_session, f"tierwin_{level}_t1_{i}", tier=1)
            for i in range(4):
                self._add_def(db_session, f"tierwin_{level}_t2_{i}", tier=2)
        else:
            for t in (5, 6, 7):
                for i in range(2):
                    self._add_def(db_session, f"tierwin_{level}_{t}_{i}", tier=t)

        ensure_period_events(db_session, profile.id, period_index, "game")

        instances = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == period_index,
            )
            .all()
        )
        assert len(instances) == EVENTS_PER_PERIOD
        for inst in instances:
            d = db_session.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
            assert event_tier_in_core_window(int(d.event_tier), level)
            assert int(d.event_tier) in allowed_tiers

    def test_once_per_profile_allowed_after_expired_without_select(self, db_session):
        profile = GameProfile(
            user_id=1,
            name="once-expired",
            save_kind="game",
            is_active=1,
            level=2,
            period_index=2,
        )
        db_session.add(profile)
        db_session.commit()

        once = self._add_def(db_session, "once_expired_evt", tier=1, repeat_policy="once_per_profile")
        self._add_def(db_session, "fill_evt_a", tier=1)
        self._add_def(db_session, "fill_evt_b", tier=1)

        db_session.add(
            EventInstance(
                game_profile_id=profile.id,
                definition_id=once.id,
                period_index=1,
                status="expired",
            )
        )
        db_session.commit()

        ensure_period_events(db_session, profile.id, 2, "game")
        picked = {
            i.definition_id
            for i in db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 2)
            .all()
        }
        assert once.id in picked


class TestPeriodEndEventSemantics:
    def test_pending_instances_expire_on_period_close(self, db_session, test_user):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(
            user_id=test_user.id,
            name="expire",
            save_kind="game",
            is_active=1,
            period_index=1,
            cash_balance=10000,
            period_duration_seconds=300,
            time_state="pause",
        )
        db_session.add(profile)
        db_session.commit()

        ed = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_groceries_discount").first()
        inst = EventInstance(
            game_profile_id=profile.id,
            definition_id=ed.id,
            period_index=1,
            status="pending",
        )
        db_session.add(inst)
        db_session.commit()

        n = expire_pending_events_for_closed_period(db_session, profile.id, 1)
        assert n == 1
        db_session.refresh(inst)
        assert inst.status == "expired"


class TestMq116ApiIntegration:
    def test_start_then_pending_events_from_seeded_catalog(self, client, auth_headers, db_session):
        start = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "MQ116",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        assert start.status_code == 200

        pending = client.get("/api/game/events/pending", headers=auth_headers)
        assert pending.status_code == 200
        body = pending.json()
        events = body.get("events") or []
        assert len(events) == EVENTS_PER_PERIOD
        for ev in events:
            assert ev.get("key", "").startswith("mq11_") or ev.get("key") in {
                "broken_phone",
                "tax_refund",
                "friend_offer",
            }
            assert len(ev.get("choices") or []) >= 2

        defs = (
            db_session.query(EventDefinition)
            .filter(
                EventDefinition.is_active == 1,
                or_(EventDefinition.mode == "game", EventDefinition.mode == "any"),
            )
            .all()
        )
        mq11_in_db = [d for d in defs if d.key in MQ11_KEYS]
        assert len(mq11_in_db) == len(MVP11_EVENT_SPECS)

    def test_choose_event_updates_character_xp_in_overview(self, client, auth_headers, db_session):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "MQ116 XP",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        client.post("/api/game/period/claim-salary", headers=auth_headers)

        before = client.get("/api/finance/overview", headers=auth_headers).json()
        xp_before = int(before["character_xp"])

        pending = client.get("/api/game/events/pending", headers=auth_headers).json()
        events = pending["events"]
        assert events

        target = next(
            (e for e in events if any((c.get("xp_delta") or 0) > 0 for c in e.get("choices") or [])),
            events[0],
        )
        choice = next(c for c in target["choices"] if (c.get("xp_delta") or 0) > 0)

        choose = client.post(
            f"/api/game/events/{target['id']}/choose",
            headers=auth_headers,
            json={"choice_id": choice["id"]},
        )
        assert choose.status_code == 200

        after = client.get("/api/finance/overview", headers=auth_headers).json()
        assert int(after["character_xp"]) >= xp_before
        assert after["character_level"] >= before["character_level"]
        assert int(after["character_xp_need_for_next"]) > 0
