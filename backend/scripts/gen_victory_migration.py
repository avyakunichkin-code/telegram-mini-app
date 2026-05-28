"""Генерация SQL для victory_config_json (UTF-8)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.victory.seeds import VICTORY_CONFIG_BY_TEMPLATE_KEY

KEYS = (
    "mq_game_basic_v1",
    "mq_game_tight_budget_v1",
    "mq_game_mortgage_stress_v1",
    "mq_game_debt_stack_v1",
)

lines = [
    "-- Цепочка целей (progression_mode chain), playtest v2. Сиды: victory_seeds.py",
    "",
]
for key in KEYS:
    payload = json.dumps(VICTORY_CONFIG_BY_TEMPLATE_KEY[key], ensure_ascii=False)
    escaped = payload.replace("'", "''")
    lines.append(f"UPDATE game_starter_templates")
    lines.append(f"SET victory_config_json = '{escaped}'")
    lines.append(f"WHERE template_key = '{key}';")
    lines.append("")

out = Path(__file__).resolve().parents[1] / "migrations" / "0032_victory_goal_chain.sql"
out.write_text("\n".join(lines), encoding="utf-8")
print(out)
