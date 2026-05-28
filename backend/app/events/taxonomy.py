"""
Тематика и UX-тип событий (metadata_json). Отдельно от event_tier (прогрессия).
"""

from __future__ import annotations

import json
from typing import Any

from ..game.rules import EventProfileCounterSnapshot
from ..models import EventDefinition

VALID_EVENT_DOMAINS = frozenset(
    {
        "consumption",
        "housing",
        "health",
        "insurance",
        "auto",
        "credit_debt",
        "investment_education",
        "social_family",
        "income_work",
        "meta",
    }
)

VALID_INTERACTION_KINDS = frozenset(
    {
        "choice",
        "informational",
        "chain_followup",
        "intro",
    }
)

DEFAULT_EVENT_DOMAIN = "consumption"
DEFAULT_INTERACTION_KIND = "choice"

# Усталость: effective_weight = base / (1 + 0.5 * times_selected)
EVENT_WEIGHT_FATIGUE_FACTOR = 0.5


def parse_event_metadata(raw: str | None) -> dict[str, Any]:
    if not raw or not str(raw).strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def event_domain(defn: EventDefinition) -> str:
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    domain = str(meta.get("event_domain") or DEFAULT_EVENT_DOMAIN).strip()
    return domain if domain in VALID_EVENT_DOMAINS else DEFAULT_EVENT_DOMAIN


def interaction_kind(defn: EventDefinition) -> str:
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    kind = str(meta.get("interaction_kind") or DEFAULT_INTERACTION_KIND).strip()
    return kind if kind in VALID_INTERACTION_KINDS else DEFAULT_INTERACTION_KIND


def build_metadata_json(
    *,
    event_domain: str,
    interaction_kind: str = DEFAULT_INTERACTION_KIND,
    scenario_shape: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    meta: dict[str, Any] = {
        "event_domain": event_domain
        if event_domain in VALID_EVENT_DOMAINS
        else DEFAULT_EVENT_DOMAIN,
        "interaction_kind": interaction_kind
        if interaction_kind in VALID_INTERACTION_KINDS
        else DEFAULT_INTERACTION_KIND,
    }
    if scenario_shape:
        meta["scenario_shape"] = scenario_shape
    if extra:
        meta.update(extra)
    return meta


def effective_event_weight(
    defn: EventDefinition, counter: EventProfileCounterSnapshot | None
) -> int:
    base = max(int(getattr(defn, "weight", 100) or 100), 1)
    if counter is None or int(counter.times_selected or 0) <= 0:
        return base
    fatigue = 1.0 + EVENT_WEIGHT_FATIGUE_FACTOR * int(counter.times_selected)
    return max(1, int(base / fatigue))
