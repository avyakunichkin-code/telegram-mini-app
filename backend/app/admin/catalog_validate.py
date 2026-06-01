"""Валидация JSON-полей справочников (C2)."""

from __future__ import annotations

import json
from typing import Any


def _parse_json_object(raw: str, *, field_label: str) -> tuple[dict[str, Any] | None, list[str]]:
    text = (raw or "").strip()
    if not text:
        return {}, []
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return None, [f"{field_label}: невалидный JSON ({exc.msg})"]
    if not isinstance(data, dict):
        return None, [f"{field_label}: ожидается объект {{}}"]
    return data, []


def validate_generic_json_object(raw: str, *, field_label: str = "JSON") -> list[str]:
    _, errors = _parse_json_object(raw, field_label=field_label)
    return errors


def validate_blueprint_json(raw: str) -> list[str]:
    data, errors = _parse_json_object(raw, field_label="blueprint_json")
    if errors:
        return errors
    assert data is not None
    if "monthly_salary" in data and not isinstance(data.get("monthly_salary"), (int, float)):
        errors.append("blueprint_json.monthly_salary должен быть числом")
    if "cash_balance" in data and not isinstance(data.get("cash_balance"), (int, float)):
        errors.append("blueprint_json.cash_balance должен быть числом")
    return errors


def validate_victory_config_json(raw: str) -> list[str]:
    data, errors = _parse_json_object(raw, field_label="victory_config_json")
    if errors:
        return errors
    assert data is not None
    goals = data.get("goals")
    if goals is None:
        errors.append("victory_config_json.goals обязателен")
    elif not isinstance(goals, list):
        errors.append("victory_config_json.goals должен быть массивом")
    else:
        for idx, goal in enumerate(goals):
            if not isinstance(goal, dict):
                errors.append(f"victory_config_json.goals[{idx}] должен быть объектом")
                continue
            if not str(goal.get("type") or "").strip():
                errors.append(f"victory_config_json.goals[{idx}].type обязателен")
            if not str(goal.get("key") or "").strip():
                errors.append(f"victory_config_json.goals[{idx}].key обязателен")
    mode = data.get("progression_mode")
    if mode is not None and mode not in ("chain", "parallel"):
        errors.append("victory_config_json.progression_mode: chain | parallel")
    return errors


def validate_effects_json(raw: str) -> list[str]:
    from ..events.constants import ALLOWED_EFFECT_KEYS

    data, errors = _parse_json_object(raw, field_label="effects_json")
    if errors:
        return errors
    assert data is not None
    unknown = set(data.keys()) - ALLOWED_EFFECT_KEYS
    if unknown:
        errors.append(f"effects_json: неизвестные ключи {sorted(unknown)}")
    return errors


def validate_audience_template_keys(raw: str) -> list[str]:
    text = (raw or "").strip()
    if not text:
        return []
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return [f"audience_template_keys: невалидный JSON ({exc.msg})"]
    if not isinstance(data, list):
        return ["audience_template_keys должен быть JSON-массивом строк"]
    for idx, item in enumerate(data):
        if not isinstance(item, str):
            return [f"audience_template_keys[{idx}] должен быть строкой"]
    return []
