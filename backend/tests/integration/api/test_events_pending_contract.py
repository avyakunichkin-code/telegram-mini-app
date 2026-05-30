"""
HTTP-контракт GET /api/game/events/pending для EventCard / EventCarouselOverlay.

Техника: integration test — реальный TestClient, минимальный seed в БД.
"""

import json

import pytest

from app.events.taxonomy import build_metadata_json
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile
from tests.fixtures.game import create_auto_liability_policy, create_game_profile


pytestmark = pytest.mark.integration


class TestEventsPendingApiContract:
    def test_pending_includes_domain_and_insurance_claim_for_fe(self, client, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id)
        create_auto_liability_policy(db_session, profile.id)

        meta = json.dumps(
            build_metadata_json(event_domain="auto", scenario_shape="incident"),
            ensure_ascii=False,
        )
        definition = EventDefinition(
            key="test_pending_dtp",
            mode="any",
            title="ДТП",
            description="Небольшое столкновение.",
            metadata_json=meta,
            is_active=1,
            weight=100,
        )
        db_session.add(definition)
        db_session.flush()

        choice = EventChoice(
            definition_id=definition.id,
            title="Оформить по ОСАГО",
            effects_json=json.dumps(
                {"insurance_claim": {"kind": "auto_liability"}},
                ensure_ascii=False,
            ),
        )
        db_session.add(choice)
        db_session.flush()

        db_session.add(
            EventInstance(
                game_profile_id=profile.id,
                definition_id=definition.id,
                period_index=profile.period_index,
                status="pending",
            )
        )
        db_session.commit()

        # Активный профиль для API — тот, что создали
        active = db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).all()
        for p in active:
            p.is_active = 1 if p.id == profile.id else 0
        db_session.commit()

        response = client.get("/api/game/events/pending")
        assert response.status_code == 200
        body = response.json()
        events = body.get("events") or []
        assert len(events) >= 1

        evt = next(e for e in events if e.get("key") == "test_pending_dtp")
        assert evt["event_domain"] == "auto"
        assert evt["title"] == "ДТП"

        insured = next(c for c in evt["choices"] if c.get("insurance_claim"))
        assert insured["insurance_claim"] is True
        assert insured["title"] == "Оформить по ОСАГО"

    def test_pending_empty_list_shape(self, client, auth_headers):
        response = client.get("/api/game/events/pending", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "events" in body
        assert isinstance(body["events"], list)
