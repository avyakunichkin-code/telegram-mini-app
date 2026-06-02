"""Каталог целей победы по template_key (идемпотентный upsert)."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.victory.seeds import VICTORY_CONFIG_BY_TEMPLATE_KEY

_GOAL_META_KEYS = frozenset({"key", "type", "title", "enabled", "required", "requires_mechanics"})

_VICTORY_GOALS_DDL = """
CREATE TABLE IF NOT EXISTS victory_goals (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) NOT NULL,
  goal_key VARCHAR(80) NOT NULL,
  goal_type VARCHAR(60) NOT NULL,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  requires_mechanics JSONB NOT NULL DEFAULT '[]'::jsonb,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
)
"""

_VICTORY_GOALS_INDEXES = (
    """
    CREATE UNIQUE INDEX IF NOT EXISTS uq_victory_goals_template_goal_key
      ON victory_goals(template_key, goal_key)
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_victory_goals_template_order
      ON victory_goals(template_key, order_index)
    """,
)


def ensure_victory_goals_table(db: Session) -> None:
    """DDL для каталога victory_goals (нет в SQLAlchemy models / create_all)."""
    db.execute(text(_VICTORY_GOALS_DDL))
    for stmt in _VICTORY_GOALS_INDEXES:
        db.execute(text(stmt))
    db.commit()


def _goal_params(goal: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in goal.items() if k not in _GOAL_META_KEYS}


def _rows_from_config() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for template_key, cfg in VICTORY_CONFIG_BY_TEMPLATE_KEY.items():
        goals = cfg.get("goals") if isinstance(cfg, dict) else None
        if not isinstance(goals, list):
            continue
        for idx, goal in enumerate(goals):
            if not isinstance(goal, dict):
                continue
            key = str(goal.get("key") or "").strip()
            if not key:
                continue
            rows.append(
                {
                    "template_key": template_key,
                    "goal_key": key,
                    "goal_type": str(goal.get("type") or "").strip(),
                    "title": str(goal.get("title") or "").strip(),
                    "order_index": (idx + 1) * 10,
                    "enabled": bool(goal.get("enabled", True)),
                    "required": bool(goal.get("required", False)),
                    "requires_mechanics": goal.get("requires_mechanics") or [],
                    "params": _goal_params(goal),
                }
            )
    return rows


def upsert_victory_goals(db: Session) -> None:
    """
    Синхронизирует victory_goals с VICTORY_CONFIG_BY_TEMPLATE_KEY.
    Безопасно вызывать на каждом старте API.
    """
    ensure_victory_goals_table(db)
    rows = _rows_from_config()
    if not rows:
        return

    stmt = text(
        """
        INSERT INTO victory_goals (
          template_key, goal_key, goal_type, title, order_index,
          enabled, required, requires_mechanics, params
        )
        VALUES (
          :template_key, :goal_key, :goal_type, :title, :order_index,
          :enabled, :required, CAST(:requires_mechanics AS jsonb), CAST(:params AS jsonb)
        )
        ON CONFLICT (template_key, goal_key) DO UPDATE SET
          goal_type = EXCLUDED.goal_type,
          title = EXCLUDED.title,
          order_index = EXCLUDED.order_index,
          enabled = EXCLUDED.enabled,
          required = EXCLUDED.required,
          requires_mechanics = EXCLUDED.requires_mechanics,
          params = EXCLUDED.params
        """
    )
    for row in rows:
        db.execute(
            stmt,
            {
                **row,
                "requires_mechanics": json.dumps(row["requires_mechanics"], ensure_ascii=False),
                "params": json.dumps(row["params"], ensure_ascii=False),
            },
        )
    db.commit()
