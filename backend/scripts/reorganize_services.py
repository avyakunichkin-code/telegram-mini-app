"""Reorganize app/services into domain packages. Run once from backend/: python scripts/reorganize_services.py"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVICES = ROOT / "app" / "services"

MOVES: list[tuple[str, str]] = [
    ("game_profiles_service.py", "game/profiles.py"),
    ("game_templates_service.py", "game/templates.py"),
    ("game_start_service.py", "game/start.py"),
    ("game_time_service.py", "game/time.py"),
    ("period_complete.py", "period/complete.py"),
    ("period_salary.py", "period/salary.py"),
    ("period_status.py", "period/status.py"),
    ("period_snapshot.py", "period/snapshot.py"),
    ("safety_fund.py", "period/safety_fund.py"),
    ("treat_self.py", "period/treat_self.py"),
    ("finance_salary_service.py", "finance/salary.py"),
    ("finance_assets_service.py", "finance/assets.py"),
    ("finance_liabilities_service.py", "finance/liabilities.py"),
    ("finance_templates_service.py", "finance/templates.py"),
    ("finance_transactions_service.py", "finance/transactions.py"),
    ("finance_overview_service.py", "finance/overview.py"),
    ("finance_analytics_service.py", "finance/analytics.py"),
    ("events_service.py", "events/service.py"),
    ("expenses_service.py", "expenses/service.py"),
    ("insurance_service.py", "insurance/service.py"),
    ("invest_service.py", "invest/service.py"),
]

IMPORT_REPLACEMENTS_IN_MOVED_FILES: list[tuple[str, str]] = [
    (r"from \.\.", "from ..."),
    (r"from \.game_templates_service import", "from .templates import"),
    (r"from \.period_snapshot import", "from .snapshot import"),
]

EXTERNAL_REPLACEMENTS: list[tuple[str, str]] = [
    ("app.services.game_profiles_service", "app.services.game.profiles"),
    ("app.services.game_templates_service", "app.services.game.templates"),
    ("app.services.game_start_service", "app.services.game.start"),
    ("app.services.game_time_service", "app.services.game.time"),
    ("app.services.period_complete", "app.services.period.complete"),
    ("app.services.period_salary", "app.services.period.salary"),
    ("app.services.period_status", "app.services.period.status"),
    ("app.services.period_snapshot", "app.services.period.snapshot"),
    ("app.services.safety_fund", "app.services.period.safety_fund"),
    ("app.services.treat_self", "app.services.period.treat_self"),
    ("app.services.finance_salary_service", "app.services.finance.salary"),
    ("app.services.finance_assets_service", "app.services.finance.assets"),
    ("app.services.finance_liabilities_service", "app.services.finance.liabilities"),
    ("app.services.finance_templates_service", "app.services.finance.templates"),
    ("app.services.finance_transactions_service", "app.services.finance.transactions"),
    ("app.services.finance_overview_service", "app.services.finance.overview"),
    ("app.services.finance_analytics_service", "app.services.finance.analytics"),
    ("app.services.events_service", "app.services.events.service"),
    ("app.services.expenses_service", "app.services.expenses.service"),
    ("app.services.insurance_service", "app.services.insurance.service"),
    ("app.services.invest_service", "app.services.invest.service"),
    ("..services.game_profiles_service", "..services.game.profiles"),
    ("..services.game_templates_service", "..services.game.templates"),
    ("..services.game_start_service", "..services.game.start"),
    ("..services.game_time_service", "..services.game.time"),
    ("..services.period_complete", "..services.period.complete"),
    ("..services.period_salary", "..services.period.salary"),
    ("..services.period_status", "..services.period.status"),
    ("..services.period_snapshot", "..services.period.snapshot"),
    ("..services.safety_fund", "..services.period.safety_fund"),
    ("..services.treat_self", "..services.period.treat_self"),
    ("..services.finance_salary_service", "..services.finance.salary"),
    ("..services.finance_liabilities_service", "..services.finance.liabilities"),
    ("..services.finance_assets_service", "..services.finance.assets"),
    ("..services.finance_templates_service", "..services.finance.templates"),
    ("..services.finance_transactions_service", "..services.finance.transactions"),
    ("..services.finance_overview_service", "..services.finance.overview"),
    ("..services.finance_analytics_service", "..services.finance.analytics"),
    ("..services.finance_liabilities_service", "..services.finance.liabilities"),
    ("..services.events_service", "..services.events.service"),
    ("..services.expenses_service", "..services.expenses.service"),
    ("..services.insurance_service", "..services.insurance.service"),
    ("..services.invest_service", "..services.invest.service"),
    (".services.events_service", ".services.events.service"),
    (".services.insurance_service", ".services.insurance.service"),
    ("services.events_service", "services.events.service"),
]


def patch_text(text: str, replacements: list[tuple[str, str]]) -> str:
    for old, new in replacements:
        text = text.replace(old, new)
    return text


def main() -> None:
    for sub in ("game", "period", "finance", "events", "expenses", "insurance", "invest"):
        (SERVICES / sub).mkdir(parents=True, exist_ok=True)
        init = SERVICES / sub / "__init__.py"
        if not init.exists():
            init.write_text(f'"""Domain service: {sub}."""\n', encoding="utf-8")

    for src_name, dest_rel in MOVES:
        src = SERVICES / src_name
        dest = SERVICES / dest_rel
        if not src.exists():
            if dest.exists():
                continue
            raise FileNotFoundError(src)
        text = src.read_text(encoding="utf-8")
        for pattern, repl in IMPORT_REPLACEMENTS_IN_MOVED_FILES:
            text = re.sub(pattern, repl, text)
        dest.write_text(text, encoding="utf-8")
        src.unlink()
        print(f"moved {src_name} -> {dest_rel}")

    # Patch repo imports
    for path in (ROOT / "app").rglob("*.py"):
        if "services" in path.parts and path.name == "reorganize_services.py":
            continue
        if path.is_relative_to(SERVICES / "scripts"):
            continue
        text = path.read_text(encoding="utf-8")
        new = patch_text(text, EXTERNAL_REPLACEMENTS)
        if new != text:
            path.write_text(new, encoding="utf-8")
            print(f"patched {path.relative_to(ROOT)}")

    for path in (ROOT / "tests").rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        new = patch_text(text, EXTERNAL_REPLACEMENTS)
        if new != text:
            path.write_text(new, encoding="utf-8")
            print(f"patched {path.relative_to(ROOT)}")

    print("done")


if __name__ == "__main__":
    main()
