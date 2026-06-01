"""
Victory goals store (DB-backed).

MVP: goals are stored in Postgres table `victory_goals` by template_key.
We keep the "header config" (min_period/progression_mode/etc.) coming from
victory_config_json for now, but override its `goals` list when DB rows exist.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from sqlalchemy.orm import Session


def _as_list_of_str(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    for x in raw:
        s = str(x).strip()
        if s:
            out.append(s)
    return out


def _validate_goals(template_key: str, goals: list[dict[str, Any]]) -> None:
    # Minimal correctness gates: unique keys + order_index presence + type/title.
    keys: set[str] = set()
    for g in goals:
        k = str(g.get("key") or "").strip()
        if not k:
            raise ValueError(f"victory_goals: empty goal key template={template_key}")
        if k in keys:
            raise ValueError(f"victory_goals: duplicate goal key={k} template={template_key}")
        keys.add(k)
        t = str(g.get("type") or "").strip()
        if not t:
            raise ValueError(f"victory_goals: empty goal type key={k} template={template_key}")
        title = str(g.get("title") or "").strip()
        if not title:
            raise ValueError(f"victory_goals: empty title key={k} template={template_key}")


def load_victory_goals_for_template(db: Session, template_key: str) -> list[dict[str, Any]]:
    """
    Returns ordered list of goal dicts compatible with victory_engine.
    Empty list means "no DB override".
    """
    tk = (template_key or "").strip()
    if not tk:
        return []

    try:
        rows = db.execute(
            text(
                """
                SELECT goal_key, goal_type, title, order_index, enabled, required,
                       requires_mechanics, params
                FROM victory_goals
                WHERE template_key = :tk
                ORDER BY order_index ASC, id ASC
                """
            ),
            {"tk": tk},
        ).mappings().all()
    except OperationalError:
        # Common in unit tests using SQLite without SQL migrations.
        return []

    if not rows:
        return []

    goals: list[dict[str, Any]] = []
    for r in rows:
        requires_raw = r.get("requires_mechanics")
        params_raw = r.get("params")
        try:
            requires = _as_list_of_str(requires_raw)
        except Exception:
            requires = []
        try:
            params = dict(params_raw) if isinstance(params_raw, dict) else {}
        except Exception:
            params = {}

        g: dict[str, Any] = {
            "key": str(r.get("goal_key") or "").strip(),
            "type": str(r.get("goal_type") or "").strip(),
            "title": str(r.get("title") or "").strip(),
            "enabled": bool(r.get("enabled", True)),
            "required": bool(r.get("required", False)),
            "requires_mechanics": requires,
        }
        # Merge params into goal payload (victory_engine expects flat keys).
        for pk, pv in params.items():
            g[pk] = pv
        goals.append(g)

    _validate_goals(tk, goals)
    return goals


def override_config_goals_from_db(
    db: Session, *, template_key: str, victory_cfg: dict[str, Any]
) -> dict[str, Any]:
    """
    If DB contains goals for template, override config['goals'] and required_goals_met.
    """
    goals = load_victory_goals_for_template(db, template_key)
    if not goals:
        return victory_cfg

    cfg = dict(victory_cfg or {})
    cfg["goals"] = goals
    # For chain configs in this codebase we usually require all steps.
    cfg["required_goals_met"] = len([g for g in goals if g.get("enabled", True)])
    # Ensure schema_version exists for safety.
    cfg.setdefault("schema_version", 1)
    return cfg

