"""Тесты victory v2: цепочка целей и parallel (legacy)."""

from app.game_rules import MIN_PERIOD_INDEX_FOR_WIN
from app.victory_engine import (
    PROGRESSION_CHAIN,
    VictoryEvaluationInput,
    evaluate_victory,
    parse_victory_config,
)
from app.victory_seeds import VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY, victory_config_for_template


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
    )
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


def _chain_complete_snap(**kwargs):
    target = 10_000.0 * 3
    defaults = dict(
        safety_fund_balance=target,
        net_monthly_cashflow=1.0,
        total_overdue_amount=0.0,
        monthly_passive_income=100_000,
    )
    defaults.update(kwargs)
    return _snap(**defaults)


class TestBasicGoalChain:
    def test_config_is_chain_v2(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        assert cfg.get("playtest_mode") == "v2"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN
        assert len(cfg["goals"]) == 4

    def test_passive_early_does_not_count_until_prior_steps(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _snap(monthly_passive_income=150_000, safety_fund_balance=0, net_monthly_cashflow=1.0),
            template_key="mq_game_basic_v1",
        )
        passive = next(g for g in r.goals if g.key == "passive_income_100k")
        assert passive.detail["raw_met"] is True
        assert passive.met is False
        assert r.current_goal_key == "safety_3x"
        assert r.goals_met == 1

    def test_all_four_chain_and_period_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _chain_complete_snap(),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_enabled == 4
        assert r.goals_met == 4
        assert r.goals_required == 4
        assert r.current_goal_key is None
        assert r.win_reached is True

    def test_early_period_blocks_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _chain_complete_snap(period_index=MIN_PERIOD_INDEX_FOR_WIN - 1),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_met == 4
        assert r.period_gate_open is False
        assert r.win_reached is False
        assert r.win_ready is True

    def test_missing_flow_blocks_later_steps(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _snap(
                net_monthly_cashflow=-100.0,
                safety_fund_balance=30_000,
                monthly_passive_income=200_000,
            ),
            template_key="mq_game_basic_v1",
        )
        assert r.current_goal_key == "flow_nonneg"
        assert r.goals_met == 0
        assert r.win_reached is False


class TestHarderGoalChain:
    def test_all_four_goals_win(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=60_000,
                total_monthly_obligations=10_000,
                monthly_passive_income=400_000,
                monthly_expenses_total=100_000,
                monthly_burn_total=19_600,
                cash_balance=10_000_000,
                owned_asset_kinds=frozenset({"rental_home", "vehicle"}),
            ),
            template_key="mq_game_debt_stack_v1",
        )
        assert r.goals_enabled == 4
        assert r.goals_met == 4
        assert r.win_reached is True

    def test_passive_net_goal_detail(self):
        cfg = victory_config_for_template("mq_game_tight_budget_v1")
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=30_000,
                total_monthly_obligations=10_000,
                monthly_passive_income=300_000,
                monthly_expenses_total=40_000,
            ),
            template_key="mq_game_tight_budget_v1",
        )
        net_goal = next(g for g in r.goals if g.type == "passive_income_net_monthly_min")
        assert net_goal.detail["raw_met"] is True
        assert net_goal.met is False
        assert r.current_goal_key == "safety_6x"


class TestSafetyFundTargetFallback:
    def test_win_target_from_obligations_without_safety_goal(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "flow",
                    "type": "net_monthly_cashflow_nonneg",
                    "title": "Поток",
                }
            ],
        }
        r = evaluate_victory(
            cfg,
            _snap(total_monthly_obligations=10_000, safety_fund_balance=15_000),
        )
        assert r.win_target_safety_fund == 30_000
        assert r.win_progress_safety_fund == 0.5


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


class TestParseVictoryConfig:
    def test_empty_falls_back_to_template(self):
        cfg = parse_victory_config("{}", template_key="mq_game_basic_v1")
        assert len(cfg["goals"]) == 4
        assert cfg.get("playtest_mode") == "v2"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN

    def test_invalid_json_falls_back(self):
        cfg = parse_victory_config("not-json", template_key="mq_game_basic_v1")
        assert cfg["required_goals_met"] == 4

    def test_legacy_parallel_mode(self):
        cfg = VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY["mq_game_basic_v1"]
        r = evaluate_victory(
            cfg,
            _chain_complete_snap(monthly_passive_income=0),
            template_key="mq_game_basic_v1",
        )
        assert r.progression_mode == "parallel"
        assert r.goals_met >= 2
