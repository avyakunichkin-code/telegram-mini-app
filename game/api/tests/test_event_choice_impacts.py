"""Превью метрик выбора события."""

import json

from app.events.choice_impacts import build_choice_impacts, resolve_lifestyle_delta_from_effects
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile
from app.events.mvp11_seeds import ensure_mvp11_event_catalog


def test_relocation_pct_raises_burn_about_28_percent(db_session):
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=1,
        name="reloc",
        save_kind="game",
        is_active=1,
        period_index=2,
        base_monthly_lifestyle_expense=10000.0,
    )
    db_session.add(profile)
    db_session.commit()

    ed = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_relocation_bonus").first()
    choice = (
        db_session.query(EventChoice)
        .filter(EventChoice.definition_id == ed.id, EventChoice.title == "Переехать в новый город")
        .first()
    )
    effects = json.loads(choice.effects_json)
    delta = resolve_lifestyle_delta_from_effects(db_session, profile, effects)
    assert delta >= 2500
    assert delta <= 4000

    impacts = build_choice_impacts(db_session, profile, effects)
    kinds = {i["kind"] for i in impacts}
    assert "cash" in kinds
    assert "burn" in kinds
    burn_imp = next(i for i in impacts if i["kind"] == "burn")
    assert float(burn_imp["delta"]) == delta
    assert float(burn_imp["value_after"]) >= 10000 + delta - 1


def test_sprain_mandatory_with_paid_outcomes(db_session):
    ensure_mvp11_event_catalog(db_session)
    ed = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_sprain_leg").first()
    assert ed is not None
    assert ed.mandatory_gate == "blocks_period_end"
    choices = db_session.query(EventChoice).filter(EventChoice.definition_id == ed.id).all()
    assert len(choices) == 3
    for ch in choices:
        effects = json.loads(ch.effects_json or "{}")
        assert float(effects.get("cash_delta") or 0) != 0 or effects.get("expense_line")
