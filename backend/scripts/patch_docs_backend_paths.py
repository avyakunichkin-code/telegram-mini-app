"""One-shot: update doc paths after ADR-007. Run from backend/: python scripts/patch_docs_backend_paths.py"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REPLACEMENTS: list[tuple[str, str]] = [
    ("backend/app/finance_overview_build.py", "backend/app/finance/overview_build.py"),
    ("backend/app/expense_template_defaults.py", "backend/app/finance/expense_defaults.py"),
    ("backend/app/game_start_validation.py", "backend/app/game/start_validation.py"),
    ("backend/app/starter_template_presentation.py", "backend/app/starters/template_presentation.py"),
    ("backend/app/mvp11_catalog_contract.py", "backend/app/events/mvp11_contract.py"),
    ("backend/app/admin_onboarding_funnel.py", "backend/app/admin/onboarding_funnel.py"),
    ("backend/app/victory_goals_store.py", "backend/app/victory/goals_store.py"),
    ("backend/app/victory_goals_lint.py", "backend/app/victory/goals_lint.py"),
    ("backend/app/event_choice_impacts.py", "backend/app/events/choice_impacts.py"),
    ("backend/app/needs_guide_content.py", "backend/app/needs/guide_content.py"),
    ("backend/app/achievement_engine.py", "backend/app/achievements/engine.py"),
    ("backend/app/achievement_seeds.py", "backend/app/achievements/seeds.py"),
    ("backend/app/insurance_catalog.py", "backend/app/starters/insurance_catalog.py"),
    ("backend/app/mvp11_event_seeds.py", "backend/app/events/mvp11_seeds.py"),
    ("backend/app/mechanics_progression.py", "backend/app/victory/mechanics_progression.py"),
    ("backend/app/starter_mechanics.py", "backend/app/starters/mechanics.py"),
    ("backend/app/profile_victory.py", "backend/app/victory/profile.py"),
    ("backend/app/victory_engine.py", "backend/app/victory/engine.py"),
    ("backend/app/victory_seeds.py", "backend/app/victory/seeds.py"),
    ("backend/app/victory_snap.py", "backend/app/victory/snap.py"),
    ("backend/app/finance_helpers.py", "backend/app/finance/helpers.py"),
    ("backend/app/finance_analytics.py", "backend/app/finance/period_metrics.py"),
    ("backend/app/game_bootstrap.py", "backend/app/game/bootstrap.py"),
    ("backend/app/game_period.py", "backend/app/game/period.py"),
    ("backend/app/balance_utils.py", "backend/app/finance/balance_utils.py"),
    ("backend/app/needs_engine.py", "backend/app/needs/engine.py"),
    ("backend/app/admin_notify.py", "backend/app/admin/notify.py"),
    ("backend/app/admin_catalogs.py", "backend/app/admin/catalogs.py"),
    ("backend/app/admin_auth.py", "backend/app/admin/auth.py"),
    ("backend/app/game_rules.py", "backend/app/game/rules.py"),
    ("backend/app/game_time.py", "backend/app/game/time.py"),
    ("backend/app/expenses.py", "backend/app/finance/expenses.py"),
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
        ROOT / "CLAUDE.md",
        ROOT / "GAME.md",
        ROOT / "design-lab",
        ROOT / "frontend-react" / "ARCHITECTURE.md",
        ROOT / "frontend-react" / "src" / "components" / "mqx" / "README.md",
    ]
    count = 0
    for root in roots:
        paths = [root] if root.suffix == ".md" else root.rglob("*.md")
        for path in paths:
            if "node_modules" in path.parts:
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
