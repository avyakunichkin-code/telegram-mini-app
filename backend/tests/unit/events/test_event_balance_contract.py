"""Trade-off контракт выборов событий (EVT1-106 baseline)."""

from app.events.balance_contract import validate_mvp11_balance
from app.events.mvp11_catalog import clear_mvp11_catalog_cache, load_mvp11_catalog

# EVT1-105: каталог без free lunch / pareto (кроме insurance/used_car — см. balance_contract).
BASELINE_MAX_VIOLATIONS = 0


def test_mvp11_balance_no_new_regressions():
    clear_mvp11_catalog_cache()
    specs, _ = load_mvp11_catalog(force_reload=True)
    violations = validate_mvp11_balance(specs)
    by_code: dict[str, int] = {}
    for v in violations:
        by_code[v.code] = by_code.get(v.code, 0) + 1
    assert len(violations) <= BASELINE_MAX_VIOLATIONS, (
        f"balance violations {len(violations)} (max {BASELINE_MAX_VIOLATIONS} until EVT1-105): "
        f"{by_code}. Sample: {violations[:5]}"
    )


def test_mvp11_balance_no_xp_delta_in_yaml():
    clear_mvp11_catalog_cache()
    specs, _ = load_mvp11_catalog(force_reload=True)
    xp = [v for v in validate_mvp11_balance(specs) if v.code == "forbidden_effect"]
    assert not xp, xp
