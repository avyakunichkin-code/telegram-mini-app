"""Trade-off контракт выборов событий (EVT1-106 baseline)."""

from app.events.balance_contract import validate_event_spec, validate_mvp11_balance
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


def test_pareto_checks_both_directions():
    spec = {
        "key": "test_transport_order",
        "choices": [
            {"title": "Дорого", "effects": {"cash_delta": -2800, "needs_delta": {"comfort": 5}}},
            {"title": "Дешевле", "effects": {"cash_delta": -900, "needs_delta": {"comfort": 3}}},
            {"title": "Отказ", "effects": {"cash_delta": 0, "needs_delta": {"health": 5}}},
        ],
    }
    violations = validate_event_spec(spec)
    assert any(v.code == "pareto_dominates" for v in violations), violations


def test_refusal_needs_bonus_on_soft_offer():
    spec = {
        "key": "test_refusal",
        "scenario_shape": "soft_offer",
        "choices": [
            {"title": "Потратить", "effects": {"cash_delta": -3000, "needs_delta": {"social": 8}}},
            {
                "title": "Отказаться",
                "effects": {"cash_delta": 0, "needs_delta": {"comfort": 4, "status": 2, "social": -3}},
            },
        ],
    }
    violations = validate_event_spec(spec)
    assert any(v.code == "refusal_needs_bonus" for v in violations), violations


def test_refusal_with_net_needs_down_is_ok():
    spec = {
        "key": "test_refusal_ok",
        "scenario_shape": "soft_offer",
        "choices": [
            {"title": "Пойти", "effects": {"cash_delta": -2000, "needs_delta": {"social": 10}}},
            {
                "title": "Остаться дома",
                "effects": {"cash_delta": 0, "needs_delta": {"social": -6, "comfort": 2}},
            },
        ],
    }
    violations = validate_event_spec(spec)
    assert not any(v.code == "refusal_needs_bonus" for v in violations), violations
