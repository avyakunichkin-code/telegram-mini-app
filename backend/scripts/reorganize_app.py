"""Reorganize flat backend/app/*.py into domain packages. Run once: python scripts/reorganize_app.py"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"

# Platform kernel — stays at app/
ROOT_MODULES = frozenset(
    {
        "auth",
        "config",
        "constants",
        "cors_settings",
        "database",
        "idempotency",
        "models",
        "schemas",
        "timeutil",
    }
)

MOVES: list[tuple[str, str]] = [
    # game
    ("game_period.py", "game/period.py"),
    ("game_time.py", "game/time.py"),
    ("game_bootstrap.py", "game/bootstrap.py"),
    ("game_rules.py", "game/rules.py"),
    ("game_start_validation.py", "game/start_validation.py"),
    # finance
    ("finance_overview_build.py", "finance/overview_build.py"),
    ("finance_helpers.py", "finance/helpers.py"),
    ("finance_analytics.py", "finance/period_metrics.py"),
    ("balance_utils.py", "finance/balance_utils.py"),
    ("expenses.py", "finance/expenses.py"),
    ("expense_template_defaults.py", "finance/expense_defaults.py"),
    # victory
    ("victory_engine.py", "victory/engine.py"),
    ("victory_seeds.py", "victory/seeds.py"),
    ("victory_snap.py", "victory/snap.py"),
    ("victory_goals_store.py", "victory/goals_store.py"),
    ("victory_goals_lint.py", "victory/goals_lint.py"),
    ("profile_victory.py", "victory/profile.py"),
    ("mechanics_progression.py", "victory/mechanics_progression.py"),
    # events
    ("event_chains.py", "events/chains.py"),
    ("event_taxonomy.py", "events/taxonomy.py"),
    ("event_choice_impacts.py", "events/choice_impacts.py"),
    ("events_constants.py", "events/constants.py"),
    ("event_mandatory.py", "events/mandatory.py"),
    ("mvp11_catalog_contract.py", "events/mvp11_contract.py"),
    ("mvp11_event_seeds.py", "events/mvp11_seeds.py"),
    ("insurance_events.py", "events/insurance_hooks.py"),
    # needs
    ("needs_engine.py", "needs/engine.py"),
    ("needs_guide_content.py", "needs/guide_content.py"),
    # admin
    ("admin_auth.py", "admin/auth.py"),
    ("admin_catalogs.py", "admin/catalogs.py"),
    ("admin_notify.py", "admin/notify.py"),
    ("admin_onboarding_funnel.py", "admin/onboarding_funnel.py"),
    # achievements
    ("achievement_engine.py", "achievements/engine.py"),
    ("achievement_seeds.py", "achievements/seeds.py"),
    # starters / catalogs
    ("starter_mechanics.py", "starters/mechanics.py"),
    ("starter_template_presentation.py", "starters/template_presentation.py"),
    ("insurance_catalog.py", "starters/insurance_catalog.py"),
]

# Longest paths first when replacing module strings.
EXTERNAL_REPLACEMENTS: list[tuple[str, str]] = [
    ("app.finance_overview_build", "app.finance.overview_build"),
    ("app.expense_template_defaults", "app.finance.expense_defaults"),
    ("app.game_start_validation", "app.game.start_validation"),
    ("app.starter_template_presentation", "app.starters.template_presentation"),
    ("app.mvp11_catalog_contract", "app.events.mvp11_contract"),
    ("app.admin_onboarding_funnel", "app.admin.onboarding_funnel"),
    ("app.victory_goals_store", "app.victory.goals_store"),
    ("app.victory_goals_lint", "app.victory.goals_lint"),
    ("app.mechanics_progression", "app.victory.mechanics_progression"),
    ("app.achievement_engine", "app.achievements.engine"),
    ("app.achievement_seeds", "app.achievements.seeds"),
    ("app.event_choice_impacts", "app.events.choice_impacts"),
    ("app.events_constants", "app.events.constants"),
    ("app.insurance_catalog", "app.starters.insurance_catalog"),
    ("app.insurance_events", "app.events.insurance_hooks"),
    ("app.mvp11_event_seeds", "app.events.mvp11_seeds"),
    ("app.needs_guide_content", "app.needs.guide_content"),
    ("app.profile_victory", "app.victory.profile"),
    ("app.finance_analytics", "app.finance.period_metrics"),
    ("app.finance_helpers", "app.finance.helpers"),
    ("app.game_bootstrap", "app.game.bootstrap"),
    ("app.game_start_validation", "app.game.start_validation"),
    ("app.game_period", "app.game.period"),
    ("app.balance_utils", "app.finance.balance_utils"),
    ("app.event_mandatory", "app.events.mandatory"),
    ("app.event_taxonomy", "app.events.taxonomy"),
    ("app.event_chains", "app.events.chains"),
    ("app.victory_engine", "app.victory.engine"),
    ("app.victory_seeds", "app.victory.seeds"),
    ("app.victory_snap", "app.victory.snap"),
    ("app.starter_mechanics", "app.starters.mechanics"),
    ("app.admin_catalogs", "app.admin.catalogs"),
    ("app.admin_notify", "app.admin.notify"),
    ("app.admin_auth", "app.admin.auth"),
    ("app.needs_engine", "app.needs.engine"),
    ("app.game_rules", "app.game.rules"),
    ("app.game_time", "app.game.time"),
    ("app.expenses", "app.finance.expenses"),
    # relative (routers, services)
    ("..finance_overview_build", "..finance.overview_build"),
    ("..expense_template_defaults", "..finance.expense_defaults"),
    ("..game_start_validation", "..game.start_validation"),
    ("..starter_template_presentation", "..starters.template_presentation"),
    ("..mvp11_catalog_contract", "..events.mvp11_contract"),
    ("..admin_onboarding_funnel", "..admin.onboarding_funnel"),
    ("..victory_goals_store", "..victory.goals_store"),
    ("..victory_goals_lint", "..victory.goals_lint"),
    ("..mechanics_progression", "..victory.mechanics_progression"),
    ("..achievement_engine", "..achievements.engine"),
    ("..achievement_seeds", "..achievements.seeds"),
    ("..event_choice_impacts", "..events.choice_impacts"),
    ("..events_constants", "..events.constants"),
    ("..insurance_catalog", "..starters.insurance_catalog"),
    ("..insurance_events", "..events.insurance_hooks"),
    ("..mvp11_event_seeds", "..events.mvp11_seeds"),
    ("..needs_guide_content", "..needs.guide_content"),
    ("..profile_victory", "..victory.profile"),
    ("..finance_analytics", "..finance.period_metrics"),
    ("..finance_helpers", "..finance.helpers"),
    ("..game_bootstrap", "..game.bootstrap"),
    ("..game_period", "..game.period"),
    ("..balance_utils", "..finance.balance_utils"),
    ("..event_mandatory", "..events.mandatory"),
    ("..event_taxonomy", "..events.taxonomy"),
    ("..event_chains", "..events.chains"),
    ("..victory_engine", "..victory.engine"),
    ("..victory_seeds", "..victory.seeds"),
    ("..victory_snap", "..victory.snap"),
    ("..starter_mechanics", "..starters.mechanics"),
    ("..admin_catalogs", "..admin.catalogs"),
    ("..admin_notify", "..admin.notify"),
    ("..admin_auth", "..admin.auth"),
    ("..needs_engine", "..needs.engine"),
    ("..game_rules", "..game.rules"),
    ("..game_time", "..game.time"),
    ("..expenses", "..finance.expenses"),
    # services (three dots from services/*)
    ("...finance_overview_build", "...finance.overview_build"),
    ("...expense_template_defaults", "...finance.expense_defaults"),
    ("...game_start_validation", "...game.start_validation"),
    ("...starter_template_presentation", "...starters.template_presentation"),
    ("...mvp11_catalog_contract", "...events.mvp11_contract"),
    ("...mechanics_progression", "...victory.mechanics_progression"),
    ("...achievement_engine", "...achievements.engine"),
    ("...achievement_seeds", "...achievements.seeds"),
    ("...event_choice_impacts", "...events.choice_impacts"),
    ("...events_constants", "...events.constants"),
    ("...insurance_catalog", "...starters.insurance_catalog"),
    ("...insurance_events", "...events.insurance_hooks"),
    ("...mvp11_event_seeds", "...events.mvp11_seeds"),
    ("...needs_guide_content", "...needs.guide_content"),
    ("...finance_analytics", "...finance.period_metrics"),
    ("...finance_helpers", "...finance.helpers"),
    ("...game_bootstrap", "...game.bootstrap"),
    ("...game_period", "...game.period"),
    ("...balance_utils", "...finance.balance_utils"),
    ("...event_mandatory", "...events.mandatory"),
    ("...event_taxonomy", "...events.taxonomy"),
    ("...event_chains", "...events.chains"),
    ("...victory_engine", "...victory.engine"),
    ("...victory_seeds", "...victory.seeds"),
    ("...victory_snap", "...victory.snap"),
    ("...starter_mechanics", "...starters.mechanics"),
    ("...needs_engine", "...needs.engine"),
    ("...game_rules", "...game.rules"),
    ("...game_time", "...game.time"),
    ("...expenses", "...finance.expenses"),
]

CROSS_PACKAGE: list[tuple[str, str]] = [
    (r"from \.expenses\b", "from ..finance.expenses"),
    (r"from \.balance_utils", "from ..finance.balance_utils"),
    (r"from \.finance_helpers", "from ..finance.helpers"),
    (r"from \.finance_analytics", "from ..finance.period_metrics"),
    (r"from \.finance_overview_build", "from ..finance.overview_build"),
    (r"from \.expense_template_defaults", "from ..finance.expense_defaults"),
    (r"from \.game_time", "from ..game.time"),
    (r"from \.game_period", "from ..game.period"),
    (r"from \.game_rules", "from ..game.rules"),
    (r"from \.game_bootstrap", "from ..game.bootstrap"),
    (r"from \.game_start_validation", "from ..game.start_validation"),
    (r"from \.needs_engine", "from ..needs.engine"),
    (r"from \.achievement_engine", "from ..achievements.engine"),
    (r"from \.achievement_seeds", "from ..achievements.seeds"),
    (r"from \.victory_engine", "from ..victory.engine"),
    (r"from \.victory_seeds", "from ..victory.seeds"),
    (r"from \.victory_snap", "from ..victory.snap"),
    (r"from \.victory_goals_store", "from ..victory.goals_store"),
    (r"from \.mechanics_progression", "from ..victory.mechanics_progression"),
    (r"from \.event_chains", "from ..events.chains"),
    (r"from \.event_taxonomy", "from ..events.taxonomy"),
    (r"from \.event_choice_impacts", "from ..events.choice_impacts"),
    (r"from \.events_constants", "from ..events.constants"),
    (r"from \.event_mandatory", "from ..events.mandatory"),
    (r"from \.mvp11_event_seeds", "from ..events.mvp11_seeds"),
    (r"from \.mvp11_catalog_contract", "from ..events.mvp11_contract"),
    (r"from \.insurance_events", "from ..events.insurance_hooks"),
    (r"from \.insurance_catalog", "from ..starters.insurance_catalog"),
    (r"from \.starter_mechanics", "from ..starters.mechanics"),
    (r"from \.starter_template_presentation", "from ..starters.template_presentation"),
    (r"from \.profile_victory", "from ..victory.profile"),
    (r"from \.admin_notify", "from ..admin.notify"),
    (r"from \.routers\.", "from ..routers."),
    (r"from \.services\.", "from ..services."),
]

INTRA_BY_PREFIX: dict[str, list[tuple[str, str]]] = {
    "game/": [
        (r"from \.game_time", "from .time"),
        (r"from \.game_period", "from .period"),
        (r"from \.game_rules", "from .rules"),
        (r"from \.game_start_validation", "from .start_validation"),
        (r"from \.finance_overview_build", "from ..finance.overview_build"),
    ],
    "finance/": [
        (r"from \.finance_analytics", "from .period_metrics"),
        (r"from \.finance_helpers", "from .helpers"),
        (r"from \.finance_overview_build", "from .overview_build"),
        (r"from \.expense_template_defaults", "from .expense_defaults"),
    ],
    "victory/": [
        (r"from \.victory_engine", "from .engine"),
        (r"from \.victory_seeds", "from .seeds"),
        (r"from \.victory_snap", "from .snap"),
        (r"from \.victory_goals_store", "from .goals_store"),
        (r"from \.mechanics_progression", "from .mechanics_progression"),
    ],
    "events/": [
        (r"from \.event_chains", "from .chains"),
        (r"from \.event_taxonomy", "from .taxonomy"),
        (r"from \.event_choice_impacts", "from .choice_impacts"),
        (r"from \.events_constants", "from .constants"),
        (r"from \.event_mandatory", "from .mandatory"),
        (r"from \.mvp11_event_seeds", "from .mvp11_seeds"),
        (r"from \.mvp11_catalog_contract", "from .mvp11_contract"),
        (r"from \.insurance_events", "from .insurance_hooks"),
    ],
    "achievements/": [
        (r"from \.achievement_engine", "from .engine"),
        (r"from \.achievement_seeds", "from .seeds"),
    ],
    "admin/": [
        (r"from \.admin_auth", "from .auth"),
        (r"from \.admin_catalogs", "from .catalogs"),
        (r"from \.admin_notify", "from .notify"),
        (r"from \.admin_onboarding_funnel", "from .onboarding_funnel"),
    ],
}


def apply_regex_replacements(text: str, rules: list[tuple[str, str]]) -> str:
    for pattern, repl in rules:
        text = re.sub(pattern, repl, text)
    return text


def bump_root_imports(text: str) -> str:
    for mod in sorted(ROOT_MODULES, key=len, reverse=True):
        text = re.sub(rf"from \.{mod}\b", f"from ..{mod}", text)
    return text


def patch_text(text: str, *, dest_rel: str | None = None) -> str:
    for old, new in EXTERNAL_REPLACEMENTS:
        text = text.replace(old, new)
    if dest_rel:
        for prefix, rules in INTRA_BY_PREFIX.items():
            if dest_rel.startswith(prefix):
                text = apply_regex_replacements(text, rules)
                break
        text = apply_regex_replacements(text, CROSS_PACKAGE)
    return text


def main() -> None:
    packages = ("game", "finance", "victory", "events", "needs", "admin", "achievements", "starters")
    for pkg in packages:
        (APP / pkg).mkdir(parents=True, exist_ok=True)
        init = APP / pkg / "__init__.py"
        if not init.exists():
            init.write_text(f'"""Domain logic: {pkg}."""\n', encoding="utf-8")

    moved_dest: set[Path] = set()
    for src_name, dest_rel in MOVES:
        src = APP / src_name
        dest = APP / dest_rel
        if not src.exists():
            if dest.exists():
                continue
            raise FileNotFoundError(src)
        text = bump_root_imports(src.read_text(encoding="utf-8"))
        text = patch_text(text, dest_rel=dest_rel)
        dest.write_text(text, encoding="utf-8")
        src.unlink()
        moved_dest.add(dest)
        print(f"moved {src_name} -> {dest_rel}")

    scan_roots = [APP, ROOT / "tests", ROOT / "scripts", ROOT / "main.py"]
    patched_files: list[Path] = []
    for root in scan_roots:
        paths = [root] if isinstance(root, Path) and root.suffix == ".py" else Path(root).rglob("*.py")
        for path in paths:
            if path in moved_dest:
                continue
            if "reorganize_app.py" in path.name:
                continue
            text = path.read_text(encoding="utf-8")
            new = patch_text(text, dest_rel=str(path.relative_to(APP)) if path.is_relative_to(APP) else None)
            if new != text:
                path.write_text(new, encoding="utf-8")
                patched_files.append(path)

    for path in patched_files:
        print(f"patched {path.relative_to(ROOT)}")

    print("done")


if __name__ == "__main__":
    main()
