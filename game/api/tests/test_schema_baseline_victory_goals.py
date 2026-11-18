"""Baseline victory_goals должен принимать INSERT из сида.

Таблица без ORM-модели: DDL только в migrations/ (PR-08 — сид её больше не создаёт).
upsert_victory_goals вставляет строки без части колонок (created_at, id) — без
DEFAULT в baseline сиды на пустой PostgreSQL падают с NotNullViolation
(тесты на SQLite этого не видят: там сид victory_goals — no-op).
"""

import inspect
import re
from pathlib import Path

from app.seeds.victory_goals import upsert_victory_goals

BASELINE = Path(__file__).resolve().parents[1] / "migrations" / "0000_schema_baseline.sql"


def _baseline_columns() -> dict[str, str]:
    text = BASELINE.read_text(encoding="utf-8")
    start = text.index("CREATE TABLE victory_goals (")
    ddl = text[start : text.index(";", start)]
    body = ddl[ddl.index("(") + 1 : ddl.rindex(")")]
    cols: dict[str, str] = {}
    for line in body.splitlines():
        line = line.strip().rstrip(",")
        if not line or line.upper().startswith("PRIMARY KEY"):
            continue
        name, rest = line.split(None, 1)
        cols[name] = re.sub(r"\s+", " ", rest).upper()
    return cols


def _seed_insert_columns() -> set[str]:
    src = inspect.getsource(upsert_victory_goals)
    m = re.search(r"INSERT INTO victory_goals \((.*?)\)", src, re.S)
    assert m, "upsert_victory_goals: не найден INSERT INTO victory_goals (...)"
    return {c.strip() for c in m.group(1).split(",") if c.strip()}


def test_seed_inserts_only_existing_baseline_columns():
    baseline = _baseline_columns()
    unknown = _seed_insert_columns() - set(baseline)
    assert not unknown, f"сид пишет колонки, которых нет в baseline: {sorted(unknown)}"


def test_columns_omitted_by_seed_have_defaults_in_baseline():
    baseline = _baseline_columns()
    omitted = set(baseline) - _seed_insert_columns()
    for name in sorted(omitted):
        spec = baseline[name]
        assert "SERIAL" in spec or "DEFAULT" in spec or "NOT NULL" not in spec, (
            f"baseline victory_goals.{name}: сид её не заполняет, нужен DEFAULT (есть: {spec})"
        )
    assert "DEFAULT NOW()" in baseline["created_at"]
