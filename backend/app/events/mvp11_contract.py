"""
Контракт каталога MVP 1.1 (MQ-116): распределение tier, объём, запрещённые темы.
Используется в pytest и при необходимости в ручной приёмке сидов.
"""

from __future__ import annotations

import json
from typing import Iterable

from sqlalchemy.orm import Session

from ..models import EventChoice, EventDefinition
from .constants import ALLOWED_EFFECT_KEYS

# TARGET_PLAYER_AND_SESSION §3 — подстроки в title/description (нижний регистр).
FORBIDDEN_CONTENT_SUBSTRINGS: tuple[str, ...] = (
    "микрозайм",
    "казино",
    "коллектор",
    "лотере",
    "быстрые деньги",
    "до зарплаты",
    "подъиграть",
)

MIN_ACTIVE_DEFS = 12
MIN_TIER_1 = 6
MIN_TIER_2_OR_3 = 4
MIN_TIER_4_PLUS = 2
MIN_CHOICES_PER_DEF = 2


def _tier_counts(specs: Iterable[dict]) -> dict[str, int]:
    tier_1 = tier_23 = tier_4p = 0
    for spec in specs:
        t = int(spec.get("event_tier", 1))
        if t == 1:
            tier_1 += 1
        elif t in (2, 3):
            tier_23 += 1
        elif t >= 4:
            tier_4p += 1
    return {"tier_1": tier_1, "tier_2_3": tier_23, "tier_4_plus": tier_4p, "total": sum(1 for _ in specs)}


def validate_mvp11_specs(specs: list[dict]) -> None:
    """Проверяет MVP11_EVENT_SPECS против SPEC_mvp-11 §9.2. Raises AssertionError."""
    counts = _tier_counts(specs)
    assert counts["total"] >= MIN_ACTIVE_DEFS, f"need >={MIN_ACTIVE_DEFS} defs, got {counts['total']}"
    assert counts["tier_1"] >= MIN_TIER_1, f"need >={MIN_TIER_1} tier-1, got {counts['tier_1']}"
    assert counts["tier_2_3"] >= MIN_TIER_2_OR_3, f"need >={MIN_TIER_2_OR_3} tier 2–3, got {counts['tier_2_3']}"
    assert counts["tier_4_plus"] >= MIN_TIER_4_PLUS, f"need >={MIN_TIER_4_PLUS} tier>=4, got {counts['tier_4_plus']}"

    keys = [s["key"] for s in specs]
    assert len(keys) == len(set(keys)), "duplicate event keys in MVP11_EVENT_SPECS"

    for spec in specs:
        assert spec.get("choices") and len(spec["choices"]) >= MIN_CHOICES_PER_DEF, spec["key"]
        blob = f"{spec.get('title', '')} {spec.get('description', '')}".lower()
        for bad in FORBIDDEN_CONTENT_SUBSTRINGS:
            assert bad not in blob, f"{spec['key']}: forbidden substring {bad!r}"
        for ch in spec["choices"]:
            effects = ch.get("effects") or {}
            unknown = set(effects.keys()) - ALLOWED_EFFECT_KEYS
            assert not unknown, f"{spec['key']}: unknown effect keys {unknown}"


def validate_mvp11_db_catalog(db: Session, *, mq11_keys: set[str]) -> None:
    """После ensure_mvp11_event_catalog: все ключи каталога в БД, активны, tier совпадают с сидами."""
    from .mvp11_seeds import MVP11_EVENT_SPECS, ensure_mvp11_event_catalog

    ensure_mvp11_event_catalog(db)
    spec_by_key = {s["key"]: s for s in MVP11_EVENT_SPECS}
    assert mq11_keys == set(spec_by_key.keys())

    for key in mq11_keys:
        row = db.query(EventDefinition).filter(EventDefinition.key == key).first()
        assert row is not None, key
        expected_active = int(spec_by_key[key].get("is_active", 1))
        assert int(row.is_active or 0) == expected_active, key
        assert int(row.event_tier) == int(spec_by_key[key]["event_tier"]), key
        assert str(row.repeat_policy) == str(spec_by_key[key].get("repeat_policy", "repeatable")), key
        choices = db.query(EventChoice).filter(EventChoice.definition_id == row.id).all()
        assert len(choices) >= MIN_CHOICES_PER_DEF, key
        for c in choices:
            try:
                effects = json.loads(c.effects_json or "{}")
            except json.JSONDecodeError as e:
                raise AssertionError(f"{key}: invalid effects_json") from e
            if isinstance(effects, dict):
                unknown = set(effects.keys()) - ALLOWED_EFFECT_KEYS
                assert not unknown, f"{key} choice {c.id}: {unknown}"
