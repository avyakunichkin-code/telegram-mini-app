"""Experiment isolation and normal-slot exposure; not a human enjoyment test."""
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from experiment_early_freelance import OFFER, compare, run_case


def test_early_offer_uses_one_slot_and_restores_runtime_functions():
    from app.services.events import spawn
    from app.events.chains import CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL

    before = (spawn.ensure_scheduled_chain_events, spawn._pick_diverse_period_events)
    report = run_case(early=True, seed=42, policy="chain_runner", periods=12)
    assert before == (spawn.ensure_scheduled_chain_events, spawn._pick_diverse_period_events)
    offers = [row for row in report["event_trace"] if row["key"] == OFFER]
    assert len(offers) == 1
    assert offers[0]["period"] == 5
    assert offers[0]["status"] == "selected"
    for period in range(1, 13):
        ordinary = [row for row in report["event_trace"] if row["period"] == period
                    and row["key"] not in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL]
        assert len(ordinary) <= 2
    followups = [row["period"] for row in report["event_trace"]
                 if row["key"].startswith("mq11_freelance") and row["key"] != OFFER]
    assert followups == [7, 9, 10]


def test_control_after_experiment_has_no_early_offer():
    # Existing catalog and runtime remain unchanged after the previous simulation.
    report = run_case(early=False, seed=42, policy="chain_runner", periods=10)
    assert not any(row["key"] == OFFER for row in report["event_trace"])
    result = compare(report, report)
    assert result["meta_mismatch"] is None
    assert not result["flags"]


def test_control_matches_unmodified_simulator():
    from balance_simulate import run_balance_simulation

    original = run_balance_simulation(policy="chain_runner", rng_seed=42, periods=2, guest_start=True)
    control = run_case(early=False, seed=42, policy="chain_runner", periods=2)
    assert control["summary"] == original["summary"]
    assert control["periods"] == original["periods"]


def test_functions_restored_even_when_simulation_fails():
    import fastapi.testclient
    from app.services.events import spawn

    before = (spawn.ensure_scheduled_chain_events, spawn._pick_diverse_period_events,
              fastapi.testclient.TestClient)
    with patch("experiment_early_freelance.run_balance_simulation", side_effect=RuntimeError("synthetic")):
        with pytest.raises(RuntimeError, match="synthetic"):
            run_case(early=True, seed=42, policy="chain_runner", periods=10)
    assert before == (spawn.ensure_scheduled_chain_events, spawn._pick_diverse_period_events,
                      fastapi.testclient.TestClient)
