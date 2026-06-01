"""
Тематика и UX-тип событий (metadata_json + EVT1-020 колонки).
Отдельно от event_tier (прогрессия).
"""

from __future__ import annotations

import json
from typing import Any

from ..game.rules import EventProfileCounterSnapshot
from ..models import EventDefinition, GameProfile

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

VALID_CONTENT_CLASSES = frozenset(
    {"universal", "profile", "instrumental", "needs_risk", "global"}
)
VALID_EVENT_SLOTS = frozenset(
    {
        "period_choice",
        "informational",
        "needs_risk",
        "chain_followup",
        "global_macro",
        "intro",
    }
)
DEFAULT_CONTENT_CLASS = "universal"
DEFAULT_EVENT_SLOT = "period_choice"
DEFAULT_AUDIENCE_KEYS: list[str] = ["all"]

# Усталость: effective_weight = base / (1 + 0.5 * times_selected)
EVENT_WEIGHT_FATIGUE_FACTOR = 0.5

_PROFILE_LEANING_KEYS: dict[str, list[str]] = {
    "mq11_friend_outing_student": ["mq_game_basic_v1"],
}


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


def normalize_content_class(raw: str | None) -> str:
    value = str(raw or DEFAULT_CONTENT_CLASS).strip()
    return value if value in VALID_CONTENT_CLASSES else DEFAULT_CONTENT_CLASS


def normalize_event_slot(raw: str | None) -> str:
    value = str(raw or DEFAULT_EVENT_SLOT).strip()
    return value if value in VALID_EVENT_SLOTS else DEFAULT_EVENT_SLOT


def parse_audience_template_keys(raw: str | list | None) -> list[str]:
    if isinstance(raw, list):
        keys = [str(x).strip() for x in raw if str(x).strip()]
        return keys or list(DEFAULT_AUDIENCE_KEYS)
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return list(DEFAULT_AUDIENCE_KEYS)
        if isinstance(parsed, list):
            keys = [str(x).strip() for x in parsed if str(x).strip()]
            return keys or list(DEFAULT_AUDIENCE_KEYS)
    return list(DEFAULT_AUDIENCE_KEYS)


def serialize_audience_template_keys(keys: list[str]) -> str:
    cleaned = [str(k).strip() for k in keys if str(k).strip()]
    return json.dumps(cleaned or list(DEFAULT_AUDIENCE_KEYS), ensure_ascii=False)


def content_class(defn: EventDefinition) -> str:
    col = getattr(defn, "content_class", None)
    if col:
        return normalize_content_class(str(col))
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    return normalize_content_class(str(meta.get("content_class") or DEFAULT_CONTENT_CLASS))


def event_slot(defn: EventDefinition) -> str:
    col = getattr(defn, "event_slot", None)
    if col:
        return normalize_event_slot(str(col))
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    return normalize_event_slot(str(meta.get("event_slot") or DEFAULT_EVENT_SLOT))


def audience_template_keys(defn: EventDefinition) -> list[str]:
    col = getattr(defn, "audience_template_keys", None)
    if col is not None:
        return parse_audience_template_keys(str(col))
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    raw = meta.get("audience_template_keys")
    if isinstance(raw, list):
        return parse_audience_template_keys(raw)
    return list(DEFAULT_AUDIENCE_KEYS)


def validate_event_taxonomy(
    *,
    content_class_value: str,
    audience_keys: list[str],
    event_key: str = "",
) -> None:
    cc = normalize_content_class(content_class_value)
    keys = parse_audience_template_keys(audience_keys)
    if cc == "profile" and "all" in keys:
        label = f"{event_key}: " if event_key else ""
        raise ValueError(f"{label}content_class profile cannot use audience all")
    if cc == "global" and "all" in keys:
        label = f"{event_key}: " if event_key else ""
        raise ValueError(f"{label}content_class global cannot use audience all")


def infer_taxonomy_from_yaml(event: dict[str, Any]) -> dict[str, Any]:
    """Дефолты period_choice / universal / all; явные поля YAML имеют приоритет."""
    key = str(event.get("definition_key") or event.get("key") or "").strip()
    interaction = str(event.get("interaction_kind") or DEFAULT_INTERACTION_KIND).strip()
    shape = str(event.get("scenario_shape") or "").strip()
    extra = event.get("extra") if isinstance(event.get("extra"), dict) else {}

    if "event_slot" in event:
        slot = normalize_event_slot(str(event.get("event_slot")))
    elif interaction == "intro":
        slot = "intro"
    elif interaction == "chain_followup":
        slot = "chain_followup"
    else:
        slot = DEFAULT_EVENT_SLOT

    if "content_class" in event:
        cc = normalize_content_class(str(event.get("content_class")))
    elif shape == "asset_linked":
        cc = "instrumental"
    elif key in _PROFILE_LEANING_KEYS or key.endswith("_student"):
        cc = "profile"
    else:
        cc = DEFAULT_CONTENT_CLASS

    if "audience_template_keys" in event:
        audience = parse_audience_template_keys(event.get("audience_template_keys"))
    elif key in _PROFILE_LEANING_KEYS:
        audience = list(_PROFILE_LEANING_KEYS[key])
    elif key.endswith("_student"):
        audience = ["mq_game_basic_v1"]
    else:
        audience = list(DEFAULT_AUDIENCE_KEYS)

    validate_event_taxonomy(content_class_value=cc, audience_keys=audience, event_key=key)
    return {
        "content_class": cc,
        "event_slot": slot,
        "audience_template_keys": audience,
    }


def audience_matches(defn: EventDefinition, profile: GameProfile) -> bool:
    keys = audience_template_keys(defn)
    if "all" in keys:
        return True
    template_key = str(getattr(profile, "starter_template_key", None) or "").strip()
    return bool(template_key) and template_key in keys


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
