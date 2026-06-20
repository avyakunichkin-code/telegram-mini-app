"""Снимок доступных вариантов выбора на момент появления EventInstance."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..models import EventChoice, EventDefinition, EventInstance, GameProfile
from .chains import active_chain_context, choice_allowed_for_chain_branch
from .insurance_hooks import find_policy_for_claim


def parse_choice_snapshot(inst: EventInstance) -> set[int] | None:
    raw = getattr(inst, "available_choice_ids_json", None)
    if raw is None:
        return None
    text = str(raw).strip()
    if not text or text in ("[]", "null"):
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list) or not data:
        return None
    return {int(x) for x in data}


def choice_available_for_profile(db: Session, profile: GameProfile, effects: dict) -> bool:
    claim = effects.get("insurance_claim")
    if not isinstance(claim, dict):
        return True
    kind = (claim.get("kind") or "").strip() or None
    product = (claim.get("product") or "").strip() or None
    insured_object = (claim.get("insured_object") or "").strip() or None
    policy_id = claim.get("policy_id")
    pid = int(policy_id) if policy_id is not None else None
    return (
        find_policy_for_claim(
            db,
            profile.id,
            kind=kind,
            product=product,
            insured_object=insured_object,
            policy_id=pid,
        )
        is not None
    )


def compute_available_choice_ids(
    db: Session,
    profile: GameProfile,
    definition: EventDefinition,
    *,
    chain_ctx: dict[str, Any] | None,
) -> list[int]:
    choices = (
        db.query(EventChoice)
        .filter(EventChoice.definition_id == definition.id)
        .order_by(EventChoice.id.asc())
        .all()
    )
    ids: list[int] = []
    for choice in choices:
        try:
            effects = json.loads(choice.effects_json or "{}")
        except json.JSONDecodeError:
            effects = {}
        if not isinstance(effects, dict):
            effects = {}
        if chain_ctx and not choice_allowed_for_chain_branch(effects, chain_ctx):
            continue
        if not choice_available_for_profile(db, profile, effects):
            continue
        ids.append(int(choice.id))
    return ids


def attach_event_instance_choice_snapshot(
    db: Session,
    profile: GameProfile,
    definition: EventDefinition,
    inst: EventInstance,
) -> None:
    chain_ctx = active_chain_context(db, profile, definition.key)
    ids = compute_available_choice_ids(db, profile, definition, chain_ctx=chain_ctx)
    inst.available_choice_ids_json = json.dumps(ids)


def ensure_event_instance_choice_snapshot(db: Session, inst: EventInstance, profile: GameProfile) -> None:
    if parse_choice_snapshot(inst) is not None:
        return
    definition = (
        db.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
    )
    if not definition:
        return
    attach_event_instance_choice_snapshot(db, profile, definition, inst)
    db.commit()
