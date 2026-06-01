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

from balance_diff import diff_reports, format_diff_markdown  # noqa: E402
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
        help="Run only these policies (tutorial, safety_first, passive)",
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
    exit_code = 0

    for entry in manifest.get("baselines") or []:
        policy = entry["policy"]
        if args.only_policies and policy not in args.only_policies:
            continue

        bid = entry["id"]
        baseline_path = baselines_dir / entry["file"]
        periods = args.periods or int(defaults.get("periods", 40))
        template = defaults.get("template_key", "mq_game_basic_v1")
        rng_seed = defaults.get("rng_seed", 42)

        print(f"\n=== {bid} ({policy}, {periods}p) ===", file=sys.stderr)

        report = run_balance_simulation(
            template_key=template,
            periods=periods,
            policy=policy,  # type: ignore[arg-type]
            rng_seed=int(rng_seed) if rng_seed is not None else 42,
        )

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
        diff = diff_reports(report, baseline)
        md = format_diff_markdown(diff, report, baseline)
        diff_path = REPORTS / f"diff__{bid}__{ts}.md"
        diff_path.write_text(md, encoding="utf-8")
        (REPORTS / f"latest_diff__{bid}.md").write_text(md, encoding="utf-8")

        verdict = "REGRESSION LIKELY" if any("REGRESSION" in f for f in diff.get("flags", [])) else (
            "NEEDS REVIEW" if diff.get("flags") else "OK"
        )
        if verdict == "REGRESSION LIKELY":
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

    summary_path = REPORTS / f"playtest_summary__{ts}.json"
    summary_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
    (REPORTS / "playtest_summary_latest.json").write_text(
        summary_path.read_text(encoding="utf-8"), encoding="utf-8"
    )

    print("\n# Balance playtest summary\n")
    for row in combined:
        print(f"- **{row['id']}**: {row.get('verdict', row.get('action'))}")
    print(f"\nSummary: `{summary_path.relative_to(REPO)}`")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
