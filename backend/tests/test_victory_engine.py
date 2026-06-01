"""Тесты victory: учебная цепочка (tutorial) и parallel (legacy)."""

from app.game.rules import MIN_PERIOD_INDEX_FOR_WIN
from app.victory.mechanics_progression import DEFAULT_HARDER_UNLOCK, TEMPLATE_MECHANICS_UNLOCK_PRESETS
from app.starters.mechanics import BASIC_V1_MECHANICS, DEFAULT_MECHANICS
from app.victory.engine import (
    PROGRESSION_CHAIN,
    VictoryEvaluationInput,
    evaluate_victory,
    parse_victory_config,
)
from app.victory.seeds import VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY, victory_config_for_template

BASIC_UNLOCK = TEMPLATE_MECHANICS_UNLOCK_PRESETS["mq_game_basic_v1"]


def _snap(**kwargs):
    defaults = dict(
        period_index=MIN_PERIOD_INDEX_FOR_WIN,
        safety_fund_balance=30_000.0,
        cash_balance=20_000.0,
        total_monthly_obligations=10_000.0,
        total_overdue_amount=0.0,
        net_monthly_cashflow=1.0,
        monthly_salary=50_000.0,
        avg_net_cashflow_6p=0.0,
        avg_net_cashflow_6p_n=0,
        monthly_burn_total=9_600.0,
        monthly_passive_income=0.0,
        monthly_expenses_total=19_600.0,
        owned_asset_kinds=frozenset(),
        salary_ever_claimed=False,
        safety_ever_contributed=False,
        has_active_deposit=False,
        has_active_bond=False,
        has_active_insurance=False,
    )
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


def _eval_basic(snap, **cfg_overrides):
    cfg = victory_config_for_template("mq_game_basic_v1")
    cfg = {**cfg, **cfg_overrides}
    return evaluate_victory(
        cfg,
        snap,
        template_key="mq_game_basic_v1",
        template_cap=BASIC_V1_MECHANICS,
        mechanics_unlock=BASIC_UNLOCK,
    )


def _safety_months_target(snap_kwargs: dict | None = None, *, mult: float = 3) -> float:
    preview = _snap(**(snap_kwargs or {}))
    pressure = float(preview.monthly_expenses_total) or float(preview.total_monthly_obligations)
    return pressure * mult


def _tutorial_complete_snap(**kwargs):
    target = _safety_months_target(kwargs, mult=3)
    defaults = dict(
        salary_ever_claimed=True,
        safety_ever_contributed=True,
        safety_fund_balance=target,
        net_monthly_cashflow=1.0,
        total_overdue_amount=0.0,
        has_active_deposit=True,
        monthly_passive_income=20_000.0,
    )
    defaults.update(kwargs)
    return _snap(**defaults)


class TestBasicTutorialChain:
    def test_config_is_tutorial_chain(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        assert cfg.get("playtest_mode") == "tutorial"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN
        assert len(cfg["goals"]) == 5

    def test_starts_at_tutorial_salary(self):
        r = _eval_basic(_snap())
        assert r.current_goal_key == "tutorial_salary"
        assert r.goals_met == 0
        assert r.mechanics_effective["capital_invest"] is True

    def test_invest_goal_available_after_salary_before_cushion_met(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=False,
                monthly_passive_income=50_000,
            )
        )
        assert r.current_goal_key == "tutorial_cushion"
        invest = next(g for g in r.goals if g.key == "tutorial_invest")
        assert invest.available is True
        assert invest.met is False
        passive = next(g for g in r.goals if g.key == "invest_income_15k")
        assert passive.available is True

    def test_invest_unlocks_after_tutorial_cushion_met(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=True,
                net_monthly_cashflow=1.0,
            )
        )
        assert r.mechanics_effective["capital_invest"] is True
        invest = next(g for g in r.goals if g.key == "tutorial_invest")
        assert invest.available is True

    def test_passive_early_does_not_count_until_prior_steps(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=True,
                safety_fund_balance=5_000.0,
                monthly_passive_income=50_000,
                net_monthly_cashflow=-100.0,
            )
        )
        passive = next(g for g in r.goals if g.key == "invest_income_15k")
        assert passive.detail.get("raw_met") is True
        assert passive.met is False
        assert r.current_goal_key == "tutorial_invest"

    def test_all_five_chain_and_period_win(self):
        r = _eval_basic(_tutorial_complete_snap())
        assert r.goals_enabled == 5
        assert r.goals_met == 5
        assert r.goals_required == 5
        assert r.current_goal_key is None
        assert r.win_reached is True

    def test_early_period_allows_win_when_chain_complete(self):
        r = _eval_basic(_tutorial_complete_snap(period_index=1))
        assert r.goals_met == 5
        assert r.period_gate_open is True
        assert r.win_reached is True
        assert r.win_ready is False

    def test_action_once_salary(self):
        r = _eval_basic(_snap(salary_ever_claimed=True))
        salary = next(g for g in r.goals if g.key == "tutorial_salary")
        assert salary.met is True
        assert r.current_goal_key == "tutorial_cushion"


def _eval_harder(template_key: str, snap, **cfg_overrides):
    cfg = victory_config_for_template(template_key)
    cfg = {**cfg, **cfg_overrides}
    return evaluate_victory(
        cfg,
        snap,
        template_key=template_key,
        template_cap=dict(DEFAULT_MECHANICS),
        mechanics_unlock=list(DEFAULT_HARDER_UNLOCK),
    )


def _harder_complete_snap(**kwargs):
    target = _safety_months_target(kwargs, mult=6)
    defaults = dict(
        salary_ever_claimed=True,
        safety_ever_contributed=True,
        safety_fund_balance=target,
        net_monthly_cashflow=1.0,
        total_overdue_amount=0.0,
        has_active_deposit=True,
        has_active_insurance=True,
        monthly_passive_income=100_000.0,
        cash_balance=10_000_000.0,
        owned_asset_kinds=frozenset({"rental_home"}),
    )
    defaults.update(kwargs)
    return _snap(**defaults)


class TestHarderTutorialChain:
    def test_config_has_seven_goals(self):
        cfg = victory_config_for_template("mq_game_tight_budget_v1")
        assert cfg.get("playtest_mode") == "tutorial"
        assert len(cfg["goals"]) == 7

    def test_debt_stack_finale_is_cash(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
        assert cfg["goals"][-1]["key"] == "cash_10m"

    def test_liabilities_locked_until_cushion(self):
        r = _eval_harder("mq_game_tight_budget_v1", _snap())
        assert r.mechanics_effective["capital_liabilities"] is False
        assert r.current_goal_key == "tutorial_salary"

    def test_liabilities_and_invest_unlock_after_cushion(self):
        r = _eval_harder(
            "mq_game_mortgage_stress_v1",
            _snap(salary_ever_claimed=True, safety_ever_contributed=True),
        )
        assert r.mechanics_effective["capital_liabilities"] is True
        assert r.mechanics_effective["capital_invest"] is True
        assert r.current_goal_key == "tutorial_invest"

    def test_tight_budget_full_chain_win(self):
        r = _eval_harder("mq_game_tight_budget_v1", _harder_complete_snap())
        assert r.goals_enabled == 7
        assert r.goals_met == 7
        assert r.win_reached is True

    def test_debt_stack_full_chain_win(self):
        r = _eval_harder("mq_game_debt_stack_v1", _harder_complete_snap())
        assert r.goals_met == 7
        assert r.win_reached is True


class TestSafetyFundMonthsGoal:
    def test_met_uses_total_outflow_when_obligations_zero(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "safety_3x",
                    "type": "safety_fund_months",
                    "title": "Подушка ≥ 3× расходов",
                    "months_multiplier": 3,
                }
            ],
        }
        snap = _snap(
            total_monthly_obligations=0.0,
            monthly_burn_total=10_000.0,
            monthly_expenses_total=10_000.0,
            safety_fund_balance=30_000.0,
        )
        r = evaluate_victory(cfg, snap, template_key="mq_game_basic_v1")
        goal = r.goals[0]
        assert goal.detail["pressure_monthly"] == 10_000.0
        assert goal.detail["target"] == 30_000.0
        assert goal.met is True

    def test_not_met_when_cushion_only_covers_obligations_not_burn(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "safety_3x",
                    "type": "safety_fund_months",
                    "title": "Подушка",
                    "months_multiplier": 3,
                }
            ],
        }
        snap = _snap(
            total_monthly_obligations=10_000.0,
            monthly_burn_total=10_000.0,
            monthly_expenses_total=20_000.0,
            safety_fund_balance=30_000.0,
        )
        r = evaluate_victory(cfg, snap, template_key="mq_game_basic_v1")
        assert r.goals[0].met is False
        assert r.goals[0].detail["target"] == 60_000.0


class TestNewGoalTypes:
    def test_passive_income_monthly_min_parallel(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "p",
                    "type": "passive_income_monthly_min",
                    "title": "Пассив",
                    "min_monthly": 50_000,
                }
            ],
        }
        r = evaluate_victory(cfg, _snap(monthly_passive_income=49_999))
        assert r.goals_met == 0
        r2 = evaluate_victory(cfg, _snap(monthly_passive_income=50_000))
        assert r2.goals_met == 1

    def test_action_once_invest_opened(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "inv",
                    "type": "action_once",
                    "title": "Инвест",
                    "action": "invest_opened",
                }
            ],
        }
        r = evaluate_victory(cfg, _snap(has_active_bond=True))
        assert r.goals[0].met is True


class TestParseVictoryConfig:
    def test_empty_falls_back_to_template(self):
        cfg = parse_victory_config("{}", template_key="mq_game_basic_v1")
        assert len(cfg["goals"]) == 5
        assert cfg.get("playtest_mode") == "tutorial"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN

    def test_invalid_json_falls_back(self):
        cfg = parse_victory_config("not-json", template_key="mq_game_basic_v1")
        assert cfg["required_goals_met"] == 5

    def test_legacy_parallel_mode(self):
        cfg = VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY["mq_game_basic_v1"]
        r = evaluate_victory(
            cfg,
            _tutorial_complete_snap(monthly_passive_income=0, has_active_deposit=False),
            template_key="mq_game_basic_v1",
        )
        assert r.progression_mode == "parallel"
        assert r.goals_met >= 2
