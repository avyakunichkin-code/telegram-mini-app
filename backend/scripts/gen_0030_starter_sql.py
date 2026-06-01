"""One-off: generate migrations/0030_starter_templates_housing_out.sql from main.py seeds."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.finance.expense_defaults import expense_budget_for_template  # noqa: E402

code = (ROOT / "main.py").read_text(encoding="utf-8").split("def ensure_schema_compatibility")[0]
ns: dict = {}
exec(code, ns)
seeds = ns["GAME_STARTER_TEMPLATE_SEEDS"]

out = [
    "-- Стартовые шаблоны: жильё в активах, burn без housing (см. main.py).",
    "",
]
for s in seeds:
    bp = dict(s["blueprint"])
    bp["expense_budget"] = expense_budget_for_template(s["template_key"], s["base_expense"], bp)
    j = json.dumps(bp, ensure_ascii=False).replace("'", "''")
    base = s["base_expense"]
    out.append(
        f"UPDATE game_starter_templates SET base_monthly_lifestyle_expense = {base}, "
        f"blueprint_json = '{j}' WHERE template_key = '{s['template_key']}';"
    )
    out.append("")

(ROOT / "migrations" / "0030_starter_templates_housing_out.sql").write_text(
    "\n".join(out), encoding="utf-8"
)
print("OK -> migrations/0030_starter_templates_housing_out.sql")
