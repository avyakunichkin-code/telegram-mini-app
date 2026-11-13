"""One-shot: update doc paths after ADR-007. Run from game/api/: python scripts/patch_docs_backend_paths.py"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

REPLACEMENTS: list[tuple[str, str]] = [
    ("game/api/app/finance_overview_build.py", "game/api/app/finance/overview_build.py"),
    ("game/api/app/expense_template_defaults.py", "game/api/app/finance/expense_defaults.py"),
    ("game/api/app/game_start_validation.py", "game/api/app/game/start_validation.py"),
    ("game/api/app/starter_template_presentation.py", "game/api/app/starters/template_presentation.py"),
    ("game/api/app/mvp11_catalog_contract.py", "game/api/app/events/mvp11_contract.py"),
    ("game/api/app/admin_onboarding_funnel.py", "game/api/app/admin/onboarding_funnel.py"),
    ("game/api/app/victory_goals_store.py", "game/api/app/victory/goals_store.py"),
    ("game/api/app/victory_goals_lint.py", "game/api/app/victory/goals_lint.py"),
    ("game/api/app/event_choice_impacts.py", "game/api/app/events/choice_impacts.py"),
    ("game/api/app/needs_guide_content.py", "game/api/app/needs/guide_content.py"),
    ("game/api/app/achievement_engine.py", "game/api/app/achievements/engine.py"),
    ("game/api/app/achievement_seeds.py", "game/api/app/achievements/seeds.py"),
    ("game/api/app/insurance_catalog.py", "game/api/app/starters/insurance_catalog.py"),
    ("game/api/app/mvp11_event_seeds.py", "game/api/app/events/mvp11_seeds.py"),
    ("game/api/app/mechanics_progression.py", "game/api/app/victory/mechanics_progression.py"),
    ("game/api/app/starter_mechanics.py", "game/api/app/starters/mechanics.py"),
    ("game/api/app/profile_victory.py", "game/api/app/victory/profile.py"),
    ("game/api/app/victory_engine.py", "game/api/app/victory/engine.py"),
    ("game/api/app/victory_seeds.py", "game/api/app/victory/seeds.py"),
    ("game/api/app/victory_snap.py", "game/api/app/victory/snap.py"),
    ("game/api/app/finance_helpers.py", "game/api/app/finance/helpers.py"),
    ("game/api/app/finance_analytics.py", "game/api/app/finance/period_metrics.py"),
    ("game/api/app/game_bootstrap.py", "game/api/app/game/bootstrap.py"),
    ("game/api/app/game_period.py", "game/api/app/game/period.py"),
    ("game/api/app/balance_utils.py", "game/api/app/finance/balance_utils.py"),
    ("game/api/app/needs_engine.py", "game/api/app/needs/engine.py"),
    ("game/api/app/admin_notify.py", "game/api/app/admin/notify.py"),
    ("game/api/app/admin_catalogs.py", "game/api/app/admin/catalogs.py"),
    ("game/api/app/admin_auth.py", "game/api/app/admin/auth.py"),
    ("game/api/app/game_rules.py", "game/api/app/game/rules.py"),
    ("game/api/app/game_time.py", "game/api/app/game/time.py"),
    ("game/api/app/expenses.py", "game/api/app/finance/expenses.py"),
    ("finance_overview_build.py", "finance/overview_build.py"),
    ("victory_engine.py", "victory/engine.py"),
    ("victory_seeds.py", "victory/seeds.py"),
    ("game_period.py", "game/period.py"),
    ("game_time.py", "game/time.py"),
    ("game_rules.py", "game/rules.py"),
    ("needs_engine.py", "needs/engine.py"),
    ("starter_mechanics.py", "starters/mechanics.py"),
    ("mvp11_event_seeds.py", "events/mvp11_seeds.py"),
    ("achievement_engine.py", "achievements/engine.py"),
    ("achievement_seeds.py", "achievements/seeds.py"),
    ("admin_notify.py", "admin/notify.py"),
    ("event_choice_impacts.py", "events/choice_impacts.py"),
    ("insurance_catalog.py", "starters/insurance_catalog.py"),
    ("expenses.py", "finance/expenses.py"),
]


def main() -> None:
    roots = [
        ROOT / "docs",
        ROOT / "AGENTS.md",
        ROOT / "game" / "docs",
        ROOT / "plan" / "docs",
        ROOT / "game" / "design-lab",
        ROOT / "game/web" / "ARCHITECTURE.md",
        ROOT / "game/web" / "src" / "components" / "mqx" / "README.md",
    ]
    count = 0
    for root in roots:
        paths = [root] if root.suffix == ".md" else root.rglob("*.md")
        for path in paths:
            if any(part == "node_modules" or part.startswith(".") for part in path.relative_to(ROOT).parts):
                continue
            text = path.read_text(encoding="utf-8")
            new = text
            for old, repl in REPLACEMENTS:
                new = new.replace(old, repl)
            if new != text:
                path.write_text(new, encoding="utf-8")
                print(path.relative_to(ROOT))
                count += 1
    print(f"patched {count} files")


if __name__ == "__main__":
    main()
