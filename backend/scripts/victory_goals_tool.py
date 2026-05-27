"""
Victory goals tool:
 - export: dump DB goals into JSON
 - import: upsert goals from JSON into DB
 - lint: run consistency checks

Usage examples (PowerShell):
  cd backend
  python scripts\\victory_goals_tool.py export --out ..\\_victory_goals.json
  python scripts\\victory_goals_tool.py lint
  python scripts\\victory_goals_tool.py import --in ..\\_victory_goals.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from sqlalchemy import text

from app.database import SessionLocal
from app.victory_goals_lint import lint_victory_goals


def _dump(db, *, template_keys: list[str] | None = None) -> dict[str, Any]:
    keys = [k.strip() for k in (template_keys or []) if k.strip()]
    if keys:
        rows = db.execute(
            text(
                """
                SELECT template_key, goal_key, goal_type, title, order_index, enabled, required,
                       requires_mechanics, params
                FROM victory_goals
                WHERE template_key = ANY(:keys)
                ORDER BY template_key ASC, order_index ASC, id ASC
                """
            ),
            {"keys": keys},
        ).mappings().all()
    else:
        rows = db.execute(
            text(
                """
                SELECT template_key, goal_key, goal_type, title, order_index, enabled, required,
                       requires_mechanics, params
                FROM victory_goals
                ORDER BY template_key ASC, order_index ASC, id ASC
                """
            )
        ).mappings().all()

    out: dict[str, Any] = {"templates": {}}
    for r in rows:
        tk = str(r["template_key"])
        out["templates"].setdefault(tk, [])
        out["templates"][tk].append(
            {
                "goal_key": r["goal_key"],
                "goal_type": r["goal_type"],
                "title": r["title"],
                "order_index": int(r["order_index"]),
                "enabled": bool(r["enabled"]),
                "required": bool(r["required"]),
                "requires_mechanics": r["requires_mechanics"] if r["requires_mechanics"] is not None else [],
                "params": r["params"] if r["params"] is not None else {},
            }
        )
    return out


def _upsert(db, payload: dict[str, Any]) -> int:
    templates = payload.get("templates")
    if not isinstance(templates, dict):
        raise ValueError("invalid payload: expected {templates: {template_key: [...]}}")

    n = 0
    stmt = text(
        """
        INSERT INTO victory_goals
          (template_key, goal_key, goal_type, title, order_index, enabled, required, requires_mechanics, params)
        VALUES
          (:template_key, :goal_key, :goal_type, :title, :order_index, :enabled, :required, :requires_mechanics::jsonb, :params::jsonb)
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

    for tk, goals in templates.items():
        if not isinstance(goals, list):
            continue
        for g in goals:
            if not isinstance(g, dict):
                continue
            db.execute(
                stmt,
                {
                    "template_key": str(tk).strip(),
                    "goal_key": str(g.get("goal_key") or "").strip(),
                    "goal_type": str(g.get("goal_type") or "").strip(),
                    "title": str(g.get("title") or "").strip(),
                    "order_index": int(g.get("order_index") or 0),
                    "enabled": bool(g.get("enabled", True)),
                    "required": bool(g.get("required", False)),
                    "requires_mechanics": json.dumps(g.get("requires_mechanics") or [], ensure_ascii=False),
                    "params": json.dumps(g.get("params") or {}, ensure_ascii=False),
                },
            )
            n += 1
    return n


def cmd_export(args) -> int:
    with SessionLocal() as db:
        payload = _dump(db, template_keys=args.template_key)
    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] exported to {args.out}")
    return 0


def cmd_import(args) -> int:
    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    with SessionLocal() as db:
        n = _upsert(db, payload)
        db.commit()
        print(f"[OK] upserted {n} goal rows")
    return 0


def cmd_lint(args) -> int:
    with SessionLocal() as db:
        issues = lint_victory_goals(db, template_keys=args.template_key)

    if not issues:
        print("[OK] no issues")
        return 0

    exit_code = 0
    for i in issues:
        print(f"[{i.severity.upper()}] template={i.template_key} goal={i.goal_key or '-'}: {i.message}")
        if i.severity == "error":
            exit_code = 2

    return exit_code


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    p_export = sub.add_parser("export")
    p_export.add_argument("--out", required=True)
    p_export.add_argument("--template-key", action="append", default=[])
    p_export.set_defaults(func=cmd_export)

    p_import = sub.add_parser("import")
    p_import.add_argument("--in", dest="input", required=True)
    p_import.set_defaults(func=cmd_import)

    p_lint = sub.add_parser("lint")
    p_lint.add_argument("--template-key", action="append", default=[])
    p_lint.set_defaults(func=cmd_lint)

    args = p.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())

