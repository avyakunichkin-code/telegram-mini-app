"""Smoke tests for balance playtest scripts (fast, in-memory)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = BACKEND / "scripts"
for p in (str(BACKEND), str(SCRIPTS)):
    if p not in sys.path:
        sys.path.insert(0, p)

from balance_diff import (  # noqa: E402
    check_report_invariants,
    check_suite_invariants,
    diff_reports,
    has_blocking_flags,
)
from balance_simulate import run_balance_simulation  # noqa: E402


def _report(policy: str, *, template: str = "mq_game_basic_v1", **summary) -> dict:
    return {"meta": {"template_key": template, "policy": policy}, "summary": summary, "periods": []}


@pytest.mark.parametrize("policy", ["tutorial", "safety_first", "passive", "chain_runner"])
def test_balance_simulate_short_run(policy: str) -> None:
    report = run_balance_simulation(
        template_key="mq_game_basic_v1",
        periods=3,
        policy=policy,  # type: ignore[arg-type]
        rng_seed=42,
    )
    assert report["meta"]["schema_version"] == 1
    assert report["meta"]["policy"] == policy
    assert report["summary"]["periods_closed"] >= 1
    assert len(report["periods"]) >= 2


def test_balance_diff_identical_reports() -> None:
    report = run_balance_simulation(periods=2, policy="tutorial", rng_seed=42)
    diff = diff_reports(report, report)
    assert diff["meta_mismatch"] is None
    assert not any("REGRESSION" in f for f in diff["flags"])


def test_balance_manifest_files_exist() -> None:
    repo = BACKEND.parent
    manifest = repo / "docs" / "balance" / "baselines" / "manifest.yaml"
    assert manifest.is_file()
    import yaml

    data = yaml.safe_load(manifest.read_text(encoding="utf-8"))
    for entry in data.get("baselines") or []:
        path = repo / "docs" / "balance" / "baselines" / entry["file"]
        assert path.is_file(), f"missing baseline {path}"
        payload = json.loads(path.read_text(encoding="utf-8"))
        assert payload["meta"]["policy"] == entry["policy"]


def test_chain_runner_completes_tutorial_steps() -> None:
    """chain_runner за 3 хода проходит действия цепочки Студента (зарплата, подушка, вложение)."""
    report = run_balance_simulation(periods=3, policy="chain_runner", rng_seed=42)
    assert report["summary"]["goals_met_peak"] >= 3
    assert report["periods"][-1]["invested"] > 0


def test_inv1_no_win_in_window_fails() -> None:
    reports = [
        _report("chain_runner", win_at_period=None, goals_met_peak=4, goals_enabled=5),
        _report("needs_keeper", win_at_period=35, goals_met_peak=5, goals_enabled=5),
    ]
    flags = check_suite_invariants(reports)
    assert any(f.startswith("INVARIANT FAIL INV-1") for f in flags)
    assert has_blocking_flags(flags)


def test_inv1_win_in_window_passes() -> None:
    reports = [_report("chain_runner", win_at_period=18), _report("needs_keeper", win_at_period=None)]
    assert check_suite_invariants(reports) == []


def test_inv3_single_axis_faster_than_reference_fails() -> None:
    reports = [_report("chain_runner", win_at_period=28), _report("needs_keeper", win_at_period=14)]
    flags = check_suite_invariants(reports)
    assert any("INV-3" in f for f in flags)


def test_inv3_within_margin_passes() -> None:
    reports = [_report("chain_runner", win_at_period=20), _report("needs_keeper", win_at_period=18)]
    assert check_suite_invariants(reports) == []


def test_inv2_rich_needs_death_fails_only_for_needs_aware() -> None:
    periods = [
        {"period": 12, "phase": "closed", "is_active": True, "cash": 300_000, "outflow": 40_000},
        {"period": 13, "phase": "closed", "is_active": False, "cash": 0, "outflow": 0},
    ]
    summary = {"defeated": True, "defeat_reason": "needs_depletion", "periods_closed": 13}
    keeper = {**_report("needs_keeper", **summary), "periods": periods}
    idle = {**_report("idle", **summary), "periods": periods}
    assert any("INV-2" in f for f in check_report_invariants(keeper))
    assert check_report_invariants(idle) == []


def test_invariants_warn_mode_is_not_blocking() -> None:
    reports = [_report("chain_runner", win_at_period=None)]
    flags = check_suite_invariants(reports, mode="warn")
    assert flags and not has_blocking_flags(flags)


def test_simulation_is_deterministic_within_one_process() -> None:
    """Полный набор гонит сценарии в одном процессе: повторный прогон обязан совпасть с первым."""
    first = run_balance_simulation(periods=4, policy="chain_runner", rng_seed=42)
    second = run_balance_simulation(periods=4, policy="chain_runner", rng_seed=42)
    assert first["periods"] == second["periods"]
