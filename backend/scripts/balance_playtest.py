#!/usr/bin/env python3
"""
Run full balance playtest: simulate all baselines from manifest, diff, combined report.

Usage (from backend/):
  python scripts/balance_playtest.py
  python scripts/balance_playtest.py --update-baselines
  python scripts/balance_playtest.py --only tutorial
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
BALANCE = REPO / "docs" / "balance"
MANIFEST = BALANCE / "baselines" / "manifest.yaml"
REPORTS = BALANCE / "reports"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
SCRIPTS = BACKEND / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from balance_diff import (  # noqa: E402
    INVARIANTS,
    check_suite_invariants,
    diff_reports,
    format_diff_markdown,
    has_blocking_flags,
)
from balance_simulate import run_balance_simulation  # noqa: E402

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore


def _load_manifest() -> dict:
    if yaml is None:
        raise SystemExit("PyYAML required: pip install pyyaml")
    return yaml.safe_load(MANIFEST.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Full balance playtest suite")
    parser.add_argument(
        "--update-baselines",
        action="store_true",
        help="Overwrite baseline JSON files (принять новый эталон)",
    )
    parser.add_argument(
        "--only",
        action="append",
        dest="only_policies",
        help="Run only these policies (tutorial, safety_first, passive, idle, needs_keeper, restructure, chain_runner)",
    )
    parser.add_argument(
        "--invariants",
        choices=["fail", "warn"],
        default="fail",
        help="Инварианты победимости: fail (exit 1) или warn (на время перекалибровки экономики)",
    )
    parser.add_argument(
        "--periods",
        type=int,
        default=None,
        help="Override periods from manifest",
    )
    args = parser.parse_args(argv)

    manifest = _load_manifest()
    defaults = manifest.get("defaults") or {}
    baselines_dir = MANIFEST.parent
    REPORTS.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    combined: list[dict] = []
    reports: list[dict] = []
    exit_code = 0

    for entry in manifest.get("baselines") or []:
        policy = entry["policy"]
        if args.only_policies and policy not in args.only_policies:
            continue

        bid = entry["id"]
        baseline_path = baselines_dir / entry["file"]
        periods = args.periods or int(defaults.get("periods", 40))
        template = entry.get("template_key") or defaults.get("template_key", "mq_game_basic_v1")
        rng_seed = defaults.get("rng_seed", 42)

        print(f"\n=== {bid} ({policy}, {periods}p) ===", file=sys.stderr)

        report = run_balance_simulation(
            template_key=template,
            periods=periods,
            policy=policy,  # type: ignore[arg-type]
            rng_seed=int(rng_seed) if rng_seed is not None else 42,
        )

        reports.append(report)
        current_path = REPORTS / f"{bid}__{ts}.json"
        current_path.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        latest_path = REPORTS / f"latest__{bid}.json"
        latest_path.write_text(current_path.read_text(encoding="utf-8"), encoding="utf-8")

        if args.update_baselines:
            baseline_path.write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"Updated baseline: {baseline_path}", file=sys.stderr)
            combined.append({"id": bid, "action": "baseline_updated", "path": str(baseline_path)})
            continue

        if not baseline_path.is_file():
            print(f"MISSING baseline: {baseline_path}", file=sys.stderr)
            combined.append({"id": bid, "verdict": "BLOCKED", "reason": "no baseline"})
            exit_code = 1
            continue

        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
        diff = diff_reports(report, baseline, invariants=args.invariants)
        md = format_diff_markdown(diff, report, baseline)
        diff_path = REPORTS / f"diff__{bid}__{ts}.md"
        diff_path.write_text(md, encoding="utf-8")
        (REPORTS / f"latest_diff__{bid}.md").write_text(md, encoding="utf-8")

        flags = diff.get("flags", [])
        if any(f.startswith("INVARIANT FAIL") for f in flags):
            verdict = "INVARIANT FAIL"
        elif any("REGRESSION" in f for f in flags):
            verdict = "REGRESSION LIKELY"
        else:
            verdict = "NEEDS REVIEW" if flags else "OK"
        if has_blocking_flags(flags):
            exit_code = 1
        combined.append(
            {
                "id": bid,
                "policy": policy,
                "verdict": verdict,
                "flags": diff.get("flags"),
                "current": str(latest_path),
                "diff": str(diff_path),
            }
        )
        print(md, file=sys.stderr)
        print(f"Verdict: {verdict}", file=sys.stderr)

    # Окно победы и доминирование — только на полном наборе: --only / короткий горизонт дали бы ложный FAIL.
    suite_periods = args.periods or int(defaults.get("periods", 40))
    if args.update_baselines or args.only_policies or suite_periods < INVARIANTS["win_window"][1]:
        suite_flags: list[str] = []
        print("\nSuite invariants: skipped (--only / --update-baselines / short horizon)", file=sys.stderr)
    else:
        suite_flags = check_suite_invariants(reports, mode=args.invariants)
        if has_blocking_flags(suite_flags):
            exit_code = 1
    if has_blocking_flags(suite_flags):
        suite_verdict = "INVARIANT FAIL"
    else:
        suite_verdict = "NEEDS REVIEW" if suite_flags else "OK"
    combined.append({"id": "suite_invariants", "verdict": suite_verdict, "flags": suite_flags})

    summary_path = REPORTS / f"playtest_summary__{ts}.json"
    summary_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
    (REPORTS / "playtest_summary_latest.json").write_text(
        summary_path.read_text(encoding="utf-8"), encoding="utf-8"
    )

    print("\n# Balance playtest summary\n")
    for row in combined:
        print(f"- **{row['id']}**: {row.get('verdict', row.get('action'))}")
        if row["id"] == "suite_invariants":
            for f in row.get("flags") or []:
                print(f"  - {f}")
    print(f"\nSummary: `{summary_path.relative_to(REPO)}`")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
