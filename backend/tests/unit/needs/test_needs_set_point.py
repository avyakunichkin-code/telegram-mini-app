"""SPEC_needs-set-point §2–3: износ, потолок, уровень жизни (CS-2, CS-3, CS-5)."""

import pytest

from app.needs.engine import AXES, parse_needs_config
from app.needs.set_point import (
    AssetHolding,
    CategorySpend,
    bonus_caps,
    compute_level,
    derive_wear,
    habituation,
    periods_to_zero_if_idle,
    pressure_invariant_violations,
    step_toward_level,
)
from app.seeds.game_starter_templates import GAME_STARTER_TEMPLATE_SEEDS

STUDENT = next(s for s in GAME_STARTER_TEMPLATE_SEEDS if s["template_key"] == "mq_game_basic_v1")
STUDENT_SALARY = 62_500
STUDENT_NORM = {
    "food": 16600, "transport": 5200, "communications": 3500,
    "health": 3900, "clothing": 3100, "leisure": 5200,
}


def _cfg(seed=STUDENT):
    return parse_needs_config(seed["blueprint"])


def _spends(overrides=None, grew=None):
    cur = {**STUDENT_NORM, **(overrides or {})}
    return [CategorySpend(c, STUDENT_NORM[c], cur[c], (grew or {}).get(c)) for c in STUDENT_NORM]


def _level(cfg, *, spends=None, assets=(), stress=None, period=1):
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    return compute_level(
        sp,
        caps=bonus_caps(wear, sp),
        salary=STUDENT_SALARY,
        period_index=period,
        spends=spends if spends is not None else _spends(),
        assets=list(assets),
        stress_flags=stress or {},
    ), wear


def test_defaults_from_initial():
    cfg = _cfg()
    assert cfg["model"] == "linear"
    sp = cfg["set_point"]
    assert sp["base"] == {ax: round(0.8 * cfg["initial"][ax]) for ax in AXES}
    assert sp["adaptation_rate"] == pytest.approx(0.10)
    assert sp["passive_periods_to_zero"] == 16


def test_wear_brings_idle_player_to_zero_in_t_periods():
    cfg = _cfg()
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    assert wear["comfort"] == pytest.approx(7.44, abs=0.01)
    # Пассивный с L = base: ровно к T (±1 из-за порога нуля) — ноль по каждой оси.
    idle = periods_to_zero_if_idle(cfg["initial"], sp["base"], wear, sp)
    for ax in AXES:
        assert idle[ax] is not None
        assert abs(idle[ax] - sp["passive_periods_to_zero"]) <= 1, (ax, idle[ax])


@pytest.mark.parametrize("seed", GAME_STARTER_TEMPLATE_SEEDS, ids=lambda s: s["template_key"])
def test_pressure_invariant_all_seeds(seed):
    """CS-5: без событий потребность обнуляется даже при максимальном бонусе уровня жизни."""
    cfg = parse_needs_config(seed["blueprint"])
    if not cfg:
        pytest.skip("needs disabled")
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    caps = bonus_caps(wear, sp)
    assert pressure_invariant_violations(wear, caps, sp) == []
    max_level = {ax: sp["base"][ax] + caps[ax] for ax in AXES}
    idle = periods_to_zero_if_idle({ax: 100.0 for ax in AXES}, max_level, wear, sp)
    assert all(v is not None for v in idle.values()), idle


def test_template_budget_gives_base_level():
    cfg = _cfg()
    res, _ = _level(cfg)
    assert res.level == {ax: float(cfg["set_point"]["base"][ax]) for ax in AXES}
    assert res.sources == []


def test_cutting_leisure_lowers_social_and_speeds_up_zero():
    """CS-2."""
    cfg = _cfg()
    sp = cfg["set_point"]
    base_res, wear = _level(cfg)
    cut_res, _ = _level(cfg, spends=_spends({"leisure": 0}))
    assert cut_res.level["social"] <= sp["base"]["social"] - 20
    idle_base = periods_to_zero_if_idle(cfg["initial"], base_res.level, wear, sp)
    idle_cut = periods_to_zero_if_idle(cfg["initial"], cut_res.level, wear, sp)
    assert idle_cut["social"] < idle_base["social"]


def test_extra_line_raises_level_with_habituation_and_cap():
    """CS-3: подписка +2 500 к связи поднимает social; вклад падает со временем."""
    cfg = _cfg()
    sp = cfg["set_point"]
    fresh, _ = _level(cfg, spends=_spends({"communications": 6000}, grew={"communications": 5}), period=5)
    old, _ = _level(cfg, spends=_spends({"communications": 6000}, grew={"communications": 5}), period=30)
    assert fresh.level["social"] > sp["base"]["social"]
    assert sp["base"]["social"] < old.level["social"] < fresh.level["social"]
    assert habituation(0, sp) == pytest.approx(1.0)
    assert habituation(6, sp) == pytest.approx(0.7)


def test_car_raises_comfort_status_but_capped():
    cfg = _cfg()
    sp = cfg["set_point"]
    res, wear = _level(cfg, assets=[AssetHolding("car_personal", "Авто", 1_200_000, 0, acquired_period=1)])
    caps = bonus_caps(wear, sp)
    assert res.level["comfort"] == pytest.approx(sp["base"]["comfort"] + caps["comfort"])
    assert any(s.source == "cap" and s.axis == "comfort" for s in res.sources)
    # Финансовые активы не влияют.
    dep, _ = _level(cfg, assets=[AssetHolding("deposit", "Вклад", 500_000, 0, acquired_period=1)])
    assert dep.level == {ax: float(sp["base"][ax]) for ax in AXES}


def test_overdue_stressor_lowers_level():
    cfg = _cfg()
    sp = cfg["set_point"]
    res, _ = _level(cfg, stress={"overdue": True, "negative_cash": False})
    assert res.level["comfort"] == pytest.approx(sp["base"]["comfort"] - 10)
    assert res.level["status"] == pytest.approx(sp["base"]["status"] - 5)


def test_step_toward_level_clamps():
    assert step_toward_level(2.0, 0.0, 7.0, 0.1) == 0.0
    assert step_toward_level(99.0, 90.0, 0.0, 0.1) == pytest.approx(98.1)


def test_starter_assets_are_norm_new_purchase_bonus_sale_loss():
    """Стартовая машина шаблона — норма; новая покупка — бонус; продажа стартовой — потеря."""
    cfg = _cfg()
    sp = cfg["set_point"]
    car = AssetHolding("car_personal", "Личная машина", 1_200_000, 18_000)
    starter = [car]
    wear = derive_wear(cfg["initial"], sp)
    caps = bonus_caps(wear, sp)

    def level(assets):
        return compute_level(
            sp, caps=caps, salary=STUDENT_SALARY, period_index=10, spends=_spends(),
            assets=assets, stress_flags={}, starter_assets=starter,
        )

    kept = level([AssetHolding("car_personal", "Личная машина", 1_200_000, 18_000, acquired_period=1)])
    assert kept.level == {ax: float(sp["base"][ax]) for ax in AXES}
    second = level([car, AssetHolding("car_personal", "Вторая", 600_000, 9_000, acquired_period=9)])
    assert second.level["comfort"] > sp["base"]["comfort"]
    sold = level([])
    assert sold.level["comfort"] < sp["base"]["comfort"]
    assert any(s.source == "asset_lost" for s in sold.sources)


def test_positive_stressor_in_config_is_clamped():
    seed = {**STUDENT, "blueprint": {**STUDENT["blueprint"], "needs": {
        **STUDENT["blueprint"]["needs"], "set_point": {"stressors": {"overdue": {"comfort": 30, "status": -5}}}}}}
    sp = parse_needs_config(seed["blueprint"])["set_point"]
    assert sp["stressors"]["overdue"] == {"comfort": 0.0, "status": -5.0}


@pytest.mark.parametrize("seed", GAME_STARTER_TEMPLATE_SEEDS, ids=lambda s: s["template_key"])
def test_level_never_exceeds_base_plus_cap(seed):
    """L ≤ base + cap при максимальном бюджете, новых активах и всех стрессорах."""
    cfg = parse_needs_config(seed["blueprint"])
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    caps = bonus_caps(wear, sp)
    huge = [CategorySpend(c, 1000.0, 1_000_000.0, 1) for c in sp["category_axes"]]
    assets = [AssetHolding(k, k, 50_000_000, 500_000, acquired_period=40) for k in ("car_personal", "mansion", "leased_dwelling")]
    for stress in ({}, {"overdue": True, "negative_cash": True}):
        res = compute_level(sp, caps=caps, salary=62_500, period_index=40, spends=huge, assets=assets, stress_flags=stress)
        for ax in AXES:
            assert res.level[ax] <= sp["base"][ax] + caps[ax] + 0.01  # округление L до 0.01


def test_new_lease_with_higher_rent_is_bonus_not_starter():
    cfg = _cfg()
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    starter = [AssetHolding("leased_dwelling", "Студия", 0, 27_500)]
    res = compute_level(
        sp, caps=bonus_caps(wear, sp), salary=STUDENT_SALARY, period_index=5, spends=_spends(),
        assets=[AssetHolding("leased_dwelling", "2-комнатная", 0, 52_500, acquired_period=5)],
        stress_flags={}, starter_assets=starter,
    )
    assert any(s.source == "asset" for s in res.sources)
    assert any(s.source == "asset_lost" for s in res.sources)


@pytest.mark.parametrize("seed", GAME_STARTER_TEMPLATE_SEEDS, ids=lambda s: s["template_key"])
def test_seed_starter_assets_give_no_bonus(seed):
    """Стартовые активы шаблона (аренда, машины, дом) — норма: L = base при бюджете шаблона."""
    from app.needs.set_point import starter_assets_from_blueprint

    cfg = parse_needs_config(seed["blueprint"])
    sp = cfg["set_point"]
    wear = derive_wear(cfg["initial"], sp)
    starters = starter_assets_from_blueprint(seed["blueprint"])
    held = [AssetHolding(a.kind, a.title, a.value, a.monthly_cost, acquired_period=1) for a in starters]
    res = compute_level(
        sp, caps=bonus_caps(wear, sp), salary=float(seed["blueprint"]["monthly_salary"]), period_index=3,
        spends=[], assets=held, stress_flags={}, starter_assets=starters,
    )
    assert [s for s in res.sources if s.source in ("asset", "asset_lost")] == []
