"""Baseline и сид victory_goals должны совпадать по DEFAULT-ам.

Таблица без ORM-модели: на пустой PostgreSQL сначала применяется baseline, потом
upsert_victory_goals вставляет строки без created_at. Без DEFAULT NOW() в baseline
сиды падают с NotNullViolation (тесты на SQLite этого не видят — там таблицу создаёт сид).
"""

import re
from pathlib import Path

from app.seeds.victory_goals import _VICTORY_GOALS_DDL

BASELINE = Path(__file__).resolve().parents[1] / "migrations" / "0000_schema_baseline.sql"


def _columns(ddl: str) -> dict[str, str]:
    body = ddl[ddl.index("(") + 1 : ddl.rindex(")")]
    cols: dict[str, str] = {}
    for line in body.splitlines():
        line = line.strip().rstrip(",")
        if not line or line.upper().startswith("PRIMARY KEY"):
            continue
        name, rest = line.split(None, 1)
        cols[name] = re.sub(r"\s+", " ", rest).upper()
    return cols


def _baseline_victory_goals_ddl() -> str:
    text = BASELINE.read_text(encoding="utf-8")
    start = text.index("CREATE TABLE victory_goals (")
    return text[start : text.index(";", start)]


def test_baseline_victory_goals_defaults_match_seed_ddl():
    baseline = _columns(_baseline_victory_goals_ddl())
    seed = _columns(_VICTORY_GOALS_DDL)
    for name, spec in seed.items():
        if "DEFAULT" not in spec:
            continue
        default = spec.split("DEFAULT", 1)[1].strip()
        assert name in baseline, f"baseline: нет колонки victory_goals.{name}"
        assert f"DEFAULT {default}" in baseline[name], (
            f"baseline victory_goals.{name}: нет DEFAULT {default} (есть: {baseline[name]})"
        )
