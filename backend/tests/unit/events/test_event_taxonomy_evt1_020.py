"""EVT1-020: content_class, event_slot, audience_template_keys."""

import pytest

from app.events.mvp11_catalog import clear_mvp11_catalog_cache, load_mvp11_catalog
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.events.taxonomy import (
    audience_matches,
    event_slot,
    infer_taxonomy_from_yaml,
    validate_event_taxonomy,
)
from app.models import EventDefinition, GameProfile


def test_infer_taxonomy_defaults_and_profile_student():
    tax = infer_taxonomy_from_yaml(
        {
            "definition_key": "mq11_friend_outing_student",
            "event_domain": "social_family",
            "scenario_shape": "soft_offer",
            "title": "t",
            "choices": [{}, {}],
        }
    )
    assert tax["content_class"] == "profile"
    assert tax["event_slot"] == "period_choice"
    assert tax["audience_template_keys"] == ["mq_game_basic_v1"]

    intro = infer_taxonomy_from_yaml(
        {
            "definition_key": "mq11_events_unlock_intro",
            "interaction_kind": "intro",
            "title": "t",
            "choices": [{}, {}],
        }
    )
    assert intro["event_slot"] == "intro"

    asset = infer_taxonomy_from_yaml(
        {
            "definition_key": "mq11_car_accident",
            "scenario_shape": "asset_linked",
            "title": "t",
            "choices": [{}, {}],
        }
    )
    assert asset["content_class"] == "instrumental"


def test_validate_profile_cannot_use_audience_all():
    with pytest.raises(ValueError, match="profile cannot use audience all"):
        validate_event_taxonomy(content_class_value="profile", audience_keys=["all"])


def test_mvp11_catalog_specs_have_taxonomy_fields():
    clear_mvp11_catalog_cache()
    specs, _ = load_mvp11_catalog(force_reload=True)
    assert len(specs) == 32
    for spec in specs:
        assert spec.get("content_class") in {
            "universal",
            "profile",
            "instrumental",
            "needs_risk",
            "global",
        }
        assert spec.get("event_slot")
        assert spec.get("audience_template_keys")


def test_ensure_mvp11_persists_taxonomy_columns(db_session):
    ensure_mvp11_event_catalog(db_session)
    row = (
        db_session.query(EventDefinition)
        .filter(EventDefinition.key == "mq11_friend_outing_student")
        .first()
    )
    assert row is not None
    assert row.content_class == "profile"
    assert row.event_slot == "period_choice"
    assert "mq_game_basic_v1" in row.audience_template_keys

    intro = (
        db_session.query(EventDefinition)
        .filter(EventDefinition.key == "mq11_events_unlock_intro")
        .first()
    )
    assert event_slot(intro) == "intro"


def test_audience_matches_filters_template():
    defn = EventDefinition(
        key="x",
        mode="any",
        title="t",
        audience_template_keys='["mq_game_basic_v1"]',
        content_class="profile",
        event_slot="period_choice",
    )
    student = GameProfile(starter_template_key="mq_game_basic_v1")
    pro = GameProfile(starter_template_key="mq_game_tight_budget_v1")
    assert audience_matches(defn, student)
    assert not audience_matches(defn, pro)
