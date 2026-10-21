"""Pending payload: сериализация инстансов и ответ GET /api/game/events/pending."""
import json

from sqlalchemy.orm import Session

from ...events.chains import (
    active_chain_context,
    choice_allowed_for_chain_branch,
    resolve_choice_effects_for_definition,
)
from ...events.choice_impacts import build_choice_impacts
from ...events.choice_snapshot import (
    choice_available_for_profile,
    ensure_event_instance_choice_snapshot,
    parse_choice_snapshot,
)
from ...events.constants import EVENTS_UNLOCK_INTRO_KEY
from ...events.taxonomy import event_domain
from ...game.rules import MIN_PERIOD_INDEX_FOR_GAME_EVENTS
from ...models import EventChoice, EventDefinition, EventInstance, GameProfile
from ...needs.engine import effective_needs_delta, needs_values_from_profile, parse_needs_delta
from ...needs.set_point import MODEL_SET_POINT
from .needs_rescue import (
    NEEDS_AXIS_LABELS,
    _event_rescue_matches_min_axis,
    _needs_config_for_profile,
    _needs_rescue_min_axis,
)
from .seeds import _ensure_seed_events
from .spawn import _o2_guidance_replaces_events_intro, ensure_events_unlock_intro, ensure_period_events


def _order_events_recommended_first(events: list[dict]) -> list[dict]:
    """Рекомендуемые (по min-оси) — в начале списка, остальные — в исходном порядке."""
    indexed = list(enumerate(events))
    indexed.sort(key=lambda t: (0 if t[1].get("recommended") else 1, t[0]))
    return [e for _, e in indexed]


def serialize_instance_rows(
    db: Session,
    insts: list[EventInstance],
    *,
    profile: GameProfile | None = None,
    needs_cfg: dict | None = None,
) -> list[dict]:
    out = []
    min_axis: str | None = None
    if profile is not None and needs_cfg is not None:
        min_axis = _needs_rescue_min_axis(needs_cfg, profile)
    for inst in insts:
        definition = db.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
        if not definition:
            continue
        if profile is not None:
            ensure_event_instance_choice_snapshot(db, inst, profile)
        snapshot_ids = parse_choice_snapshot(inst)
        choices = (
            db.query(EventChoice)
            .filter(EventChoice.definition_id == definition.id)
            .order_by(EventChoice.id.asc())
            .all()
        )
        chain_ctx: dict | None = None
        if profile is not None:
            chain_ctx = active_chain_context(db, profile, definition.key)

        choice_rows = []
        for c in choices:
            try:
                effects = json.loads(c.effects_json or "{}")
            except json.JSONDecodeError:
                effects = {}
            if not isinstance(effects, dict):
                effects = {}
            if chain_ctx and not choice_allowed_for_chain_branch(effects, chain_ctx):
                continue
            if snapshot_ids is not None:
                if int(c.id) not in snapshot_ids:
                    continue
            elif profile is not None and not choice_available_for_profile(db, profile, effects):
                continue
            if profile is not None:
                effects = resolve_choice_effects_for_definition(
                    db, profile, definition.key, effects
                )
            row = {"id": c.id, "title": c.title, "description": c.description}
            if effects.get("insurance_claim"):
                row["insurance_claim"] = True
            if profile is not None:
                row["impacts"] = build_choice_impacts(db, profile, effects, chain_ctx=chain_ctx)
                needs_cfg = _needs_config_for_profile(db, profile)
                if needs_cfg and effects.get("needs_delta") is not None:
                    try:
                        nd = parse_needs_delta(effects.get("needs_delta"))
                        if any(abs(v) >= 1e-6 for v in nd.values()):
                            if needs_cfg.get("model") == MODEL_SET_POINT:
                                # Показываем фактический прирост (запас до 100), сырой — отдельно.
                                row["needs_delta_raw"] = nd
                                nd = effective_needs_delta(needs_values_from_profile(profile), nd)
                            row["needs_delta"] = nd
                    except ValueError:
                        pass
            choice_rows.append(row)
        row = {
            "id": inst.id,
            "period_index": inst.period_index,
            "key": definition.key,
            "event_domain": event_domain(definition),
            "title": definition.title,
            "description": definition.description,
            "choices": choice_rows,
        }
        if min_axis and _event_rescue_matches_min_axis(definition, min_axis):
            row["recommended"] = True
            row["recommended_for_need"] = NEEDS_AXIS_LABELS.get(min_axis, min_axis)
            row["recommended_hint"] = (
                f"Рекомендуемое событие — помогает поднять «{row['recommended_for_need']}»"
            )
        out.append(row)
    return out


def build_pending_events_payload(db: Session, profile: GameProfile) -> dict:
    _ensure_seed_events(db)

    if int(profile.period_index or 1) < MIN_PERIOD_INDEX_FOR_GAME_EVENTS:
        return {"events": [], "event": None}

    o2_intro = _o2_guidance_replaces_events_intro(db, profile)
    if not o2_intro:
        ensure_events_unlock_intro(db, profile)
    ensure_period_events(db, profile.id, profile.period_index, profile.save_kind)

    insts = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == profile.id,
            EventInstance.status == "pending",
            EventInstance.period_index == profile.period_index,
        )
        .order_by(EventInstance.id.asc())
        .all()
    )

    needs_cfg = _needs_config_for_profile(db, profile)
    events = serialize_instance_rows(db, insts, profile=profile, needs_cfg=needs_cfg)
    if o2_intro:
        events = [e for e in events if e.get("key") != EVENTS_UNLOCK_INTRO_KEY]
    events = _order_events_recommended_first(events)

    first = events[0] if events else None
    min_axis = _needs_rescue_min_axis(needs_cfg, profile) if needs_cfg else None

    payload: dict = {
        "events": events,
        "event": first,
    }
    if min_axis:
        payload["needs_rescue_focus"] = {
            "axis": min_axis,
            "label": NEEDS_AXIS_LABELS.get(min_axis, min_axis),
        }
    return payload
