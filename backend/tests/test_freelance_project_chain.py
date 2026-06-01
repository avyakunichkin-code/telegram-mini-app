"""Цепочка mq11_freelance_project_* — расписание, ветки, mandatory."""

import json

import pytest

from app.events.chains import (
    FREELANCE_PROJECT_CHAIN_KEY,
    choice_allowed_for_chain_branch,
    ensure_scheduled_chain_events,
    get_active_chain,
    schedule_event_chain,
)
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.events.mandatory import pending_mandatory_blocking_event_titles
from app.models import EventDefinition, EventInstance, GameProfile


@pytest.fixture()
def student_profile(db_session):
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=1,
        name="freelance-chain",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        period_index=1,
        cash_balance=50_000,
    )
    db_session.add(profile)
    db_session.commit()
    return profile


class TestFreelanceProjectChain:
    def test_schedule_midperiod_after_two_periods(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_midperiod",
            after_periods=2,
            context={"payment": "advance", "branch": "advance"},
        )
        db_session.commit()
        chain = get_active_chain(db_session, student_profile.id, FREELANCE_PROJECT_CHAIN_KEY)
        assert chain is not None
        assert chain.due_period_index == 3

    def test_midperiod_mandatory_and_branch_filter(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_midperiod",
            after_periods=1,
            context={"payment": "advance", "branch": "advance"},
        )
        db_session.commit()
        ensure_scheduled_chain_events(db_session, student_profile.id, 2)
        defn = (
            db_session.query(EventDefinition)
            .filter(EventDefinition.key == "mq11_freelance_project_midperiod")
            .first()
        )
        assert defn is not None
        assert defn.mandatory_gate == "blocks_period_end"
        titles = pending_mandatory_blocking_event_titles(db_session, student_profile.id, 2)
        assert any("Середина" in t for t in titles)

        ctx = json.loads(
            get_active_chain(db_session, student_profile.id, FREELANCE_PROJECT_CHAIN_KEY).context_json
        )
        grill = {
            "requires_chain_branch": "advance",
            "needs_delta": {"social": 8},
        }
        grind = {"requires_chain_branch": "deferred"}
        assert choice_allowed_for_chain_branch(grill, ctx)
        assert not choice_allowed_for_chain_branch(grind, ctx)

    def test_grill_path_surfaces_rush_deadline(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_deadline_rush",
            after_periods=1,
            context={"payment": "advance", "prep": "grill", "branch": "advance_grill"},
        )
        db_session.commit()
        created = ensure_scheduled_chain_events(db_session, student_profile.id, 2)
        assert created == 1
        inst = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == student_profile.id,
                EventInstance.period_index == 2,
                EventInstance.status == "pending",
            )
            .first()
        )
        defn = db_session.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
        assert defn.key == "mq11_freelance_project_deadline_rush"
        assert defn.mandatory_gate == "blocks_period_end"
