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

from balance_diff import diff_reports  # noqa: E402
from balance_simulate import run_balance_simulation  # noqa: E402


@pytest.mark.parametrize("policy", ["tutorial", "safety_first", "passive"])
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
