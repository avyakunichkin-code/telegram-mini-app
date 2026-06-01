#!/usr/bin/env python3
"""Сверка 0000_schema_baseline.sql с таблицами из SQLAlchemy models (public)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "migrations" / "0000_schema_baseline.sql"

sys.path.insert(0, str(ROOT))

from app.database import Base  # noqa: E402
import app.models  # noqa: F401, E402 — register tables


def tables_from_models() -> set[str]:
    return {t.name for t in Base.metadata.sorted_tables}


def tables_from_baseline(text: str) -> set[str]:
    found: set[str] = set()
    patterns = [
        re.compile(r"CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)", re.I),
        re.compile(r"CREATE TABLE(?: IF NOT EXISTS)?\s+\"?(\w+)\"?", re.I),
    ]
    for pat in patterns:
        found.update(pat.findall(text))
    return found


def main() -> int:
    if not BASELINE.is_file():
        print(f"[fail] Missing {BASELINE}")
        return 1

    text = BASELINE.read_text(encoding="utf-8")
    model_tables = tables_from_models()
    baseline_tables = tables_from_baseline(text)

    missing = sorted(model_tables - baseline_tables)
    extra = sorted(baseline_tables - model_tables)

    print(f"Models:   {len(model_tables)} tables")
    print(f"Baseline: {len(baseline_tables)} CREATE TABLE matches")

    if missing:
        print("\n[warn] In models but not found in baseline SQL:")
        for name in missing:
            print(f"  - {name}")

    if extra:
        print("\n[info] In baseline but not in current models (legacy OK):")
        for name in extra[:20]:
            print(f"  - {name}")
        if len(extra) > 20:
            print(f"  … and {len(extra) - 20} more")

    if missing:
        print("\n[fail] Baseline may be incomplete — re-run dump or add migration.")
        return 1

    print("\n[OK] All model tables appear in baseline.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
