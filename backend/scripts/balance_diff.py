#!/usr/bin/env python3
"""
Diff two balance_simulate.py JSON reports (current vs baseline).

Thresholds: docs/balance/THRESHOLDS.md

Usage (from backend/):
  python scripts/balance_diff.py --current report.json --baseline docs/balance/baselines/main__student_tutorial_40p.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

DIFF_THRESHOLDS = {
    "periods_closed_delta_warning": 3,
    "periods_closed_delta_defeat_regression": 2,
    "cash_pct_warning": 10.0,
    "cash_pct_regression": 25.0,
    "events_resolved_pct_warning": 10.0,
}


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _num_delta(cur: float | int | None, base: float | int | None) -> str:
    if cur is None and base is None:
        return "—"
    if base is None:
        return f"{cur} (new)"
    if cur is None:
        return f"was {base}"
    d = float(cur) - float(base)
    pct = (d / float(base) * 100) if base else 0
    sign = "+" if d >= 0 else ""
    return f"{base} -> {cur} ({sign}{d:,.0f}, {sign}{pct:.1f}%)"


def _cash_shift_flags(
    key: str, cur_v: float | int | None, base_v: float | int | None, flags: list[str]
) -> None:
    if cur_v is None or base_v is None:
        return
    pct = abs(float(cur_v) - float(base_v)) / max(abs(float(base_v)), 1) * 100
    if pct >= DIFF_THRESHOLDS["cash_pct_regression"]:
        flags.append(f"REGRESSION: {key} сдвиг {pct:.0f}% ({base_v} -> {cur_v})")
    elif pct >= DIFF_THRESHOLDS["cash_pct_warning"]:
        flags.append(f"WARNING: {key} сдвиг {pct:.0f}% ({base_v} -> {cur_v})")


def diff_reports(current: dict, baseline: dict) -> dict[str, Any]:
    cm, bm = current.get("meta", {}), baseline.get("meta", {})
    cs, bs = current.get("summary", {}), baseline.get("summary", {})

    if cm.get("template_key") != bm.get("template_key") or cm.get("policy") != bm.get("policy"):
        mismatch = {
            "current": f"{cm.get('template_key')}/{cm.get('policy')}",
            "baseline": f"{bm.get('template_key')}/{bm.get('policy')}",
        }
    else:
        mismatch = None

    if cm.get("rng_seed") != bm.get("rng_seed"):
        flags_seed = [
            f"WARNING: rng_seed {bm.get('rng_seed')} -> {cm.get('rng_seed')} (сравнение может быть шумным)"
        ]
    else:
        flags_seed = []

    summary_keys = [
        "win_at_period",
        "win_reached",
        "defeated",
        "defeat_reason",
        "goals_met",
        "goals_enabled",
        "periods_closed",
        "cash_end",
        "safety_end",
        "liquid_end",
        "max_neg_streak",
        "max_overdue",
        "periods_to_safety_3x",
        "events_resolved",
        "salary_claim_rate",
        "cash_p12",
        "cash_p20",
        "cash_p30",
        "cash_p40",
        "liquid_p12",
        "liquid_p20",
        "liquid_p40",
        "safety_p12",
        "safety_p20",
        "safety_p40",
    ]

    rows: list[dict[str, Any]] = []
    flags: list[str] = list(flags_seed)

    for key in summary_keys:
        cur_v = cs.get(key)
        base_v = bs.get(key)
        changed = cur_v != base_v
        row = {"metric": key, "baseline": base_v, "current": cur_v, "changed": changed}
        numeric_keys = (
            "cash_",
            "liquid_",
            "safety_p",
            "_end",
            "max_overdue",
            "events_resolved",
        )
        if any(k in key for k in numeric_keys) and key != "defeat_reason":
            row["delta_text"] = _num_delta(
                float(cur_v) if cur_v is not None else None,
                float(base_v) if base_v is not None else None,
            )
        else:
            row["delta_text"] = f"{base_v} -> {cur_v}" if changed else str(cur_v)
        rows.append(row)

        if not changed:
            continue

        if key == "win_reached" and base_v and not cur_v:
            flags.append("REGRESSION: win_reached true -> false")
        elif key == "win_reached" and not base_v and cur_v:
            flags.append("INFO: win_reached достигнута")

        if key == "win_at_period":
            if cur_v is None and base_v is not None:
                flags.append("REGRESSION: победа больше не достигается на горизонте")
            elif cur_v is not None and base_v is None:
                flags.append(f"INFO: победа появилась на P{cur_v}")
            elif cur_v is not None and base_v is not None:
                if int(cur_v) < int(base_v):
                    flags.append(f"INFO: победа раньше (P{cur_v} vs P{base_v})")
                elif int(cur_v) > int(base_v):
                    flags.append(f"INFO: победа позже (P{cur_v} vs P{base_v})")

        elif key == "defeated":
            if cur_v and not base_v:
                flags.append(f"REGRESSION: поражение ({cs.get('defeat_reason')})")
            elif not cur_v and base_v:
                flags.append("INFO: поражение убрано")

        elif key == "goals_met" and cur_v is not None and base_v is not None and cur_v < base_v:
            flags.append(f"REGRESSION: goals_met {cur_v} < {base_v}")
        elif key == "goals_met" and cur_v is not None and base_v is not None and cur_v > base_v:
            flags.append(f"INFO: goals_met {base_v} -> {cur_v}")

        elif key == "max_neg_streak" and cur_v is not None and base_v is not None and cur_v > base_v:
            flags.append(f"WARNING: max_neg_streak {base_v} -> {cur_v}")

        elif key == "max_overdue" and cur_v is not None and base_v is not None and float(cur_v) > float(base_v):
            flags.append(f"WARNING: max_overdue {base_v} -> {cur_v}")

        elif key == "salary_claim_rate" and cur_v is not None and base_v is not None and float(cur_v) < float(
            base_v
        ):
            flags.append(f"WARNING: salary_claim_rate {base_v} -> {cur_v}")

        elif key.startswith("cash_") or key.startswith("liquid_") or key.startswith("safety_p"):
            _cash_shift_flags(key, cur_v, base_v, flags)

        elif key == "events_resolved" and cur_v is not None and base_v is not None and int(base_v) > 0:
            pct = abs(int(cur_v) - int(base_v)) / int(base_v) * 100
            if pct > DIFF_THRESHOLDS["events_resolved_pct_warning"]:
                flags.append(f"WARNING: events_resolved {base_v} -> {cur_v} ({pct:.0f}%)")

    # Cross-metric: defeat timing
    if cs.get("defeated") and bs.get("defeated"):
        pc, pb = cs.get("periods_closed"), bs.get("periods_closed")
        if pc is not None and pb is not None:
            delta_p = int(pb) - int(pc)
            if delta_p >= DIFF_THRESHOLDS["periods_closed_delta_defeat_regression"]:
                flags.append(f"REGRESSION: поражение на P{pc} vs эталон P{pb} (раньше на {delta_p})")
            elif delta_p <= -DIFF_THRESHOLDS["periods_closed_delta_defeat_regression"]:
                flags.append(f"INFO: поражение позже (P{pc} vs P{pb})")
    elif not cs.get("defeated") and not bs.get("defeated"):
        pc, pb = cs.get("periods_closed"), bs.get("periods_closed")
        if pc is not None and pb is not None:
            if abs(int(pc) - int(pb)) >= DIFF_THRESHOLDS["periods_closed_delta_warning"]:
                flags.append(f"WARNING: periods_closed {pb} -> {pc}")

    return {
        "meta_mismatch": mismatch,
        "baseline_git": bm.get("git_sha"),
        "current_git": cm.get("git_sha"),
        "rows": rows,
        "flags": flags,
    }


def format_diff_markdown(diff: dict, current: dict, baseline: dict) -> str:
    cm, bm = current.get("meta", {}), baseline.get("meta", {})
    lines = [
        "# Balance diff",
        "",
        f"- **Current:** `{cm.get('template_key')}` / `{cm.get('policy')}` @ {cm.get('git_sha', 'n/a')} (seed {cm.get('rng_seed')})",
        f"- **Baseline:** `{bm.get('template_key')}` / `{bm.get('policy')}` @ {bm.get('git_sha', 'n/a')} (seed {bm.get('rng_seed')})",
        "",
    ]
    if diff.get("meta_mismatch"):
        lines.append(f"> **INVALID:** разные сценарии: {diff['meta_mismatch']}")
        lines.append("")

    if diff.get("flags"):
        lines.append("## Флаги")
        lines.append("")
        for f in diff["flags"]:
            lines.append(f"- {f}")
        lines.append("")

    lines.extend(
        [
            "## Метрики",
            "",
            "| Метрика | Baseline | Current | Δ |",
            "|---------|----------|---------|---|",
        ]
    )
    for row in diff["rows"]:
        ch = " **" if row["changed"] else ""
        lines.append(
            f"| {row['metric']} | {row['baseline']} | {row['current']} |{ch} {row['delta_text']}{ch} |"
        )
    lines.append("")

    if diff.get("meta_mismatch"):
        verdict = "INVALID COMPARISON"
    elif any("REGRESSION" in f for f in diff.get("flags", [])):
        verdict = "REGRESSION LIKELY"
    elif any("WARNING" in f for f in diff.get("flags", [])):
        verdict = "NEEDS REVIEW"
    elif not diff.get("flags"):
        verdict = "NO SIGNIFICANT DELTA"
    else:
        verdict = "OK (INFO only)"
    lines.append(f"**Вердикт (эвристика):** {verdict}")
    lines.append("")
    lines.append("Пороги: `docs/balance/THRESHOLDS.md`")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Diff balance JSON reports")
    parser.add_argument("--current", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--out", type=Path, help="Write markdown to file")
    args = parser.parse_args(argv)

    current = _load(args.current)
    baseline = _load(args.baseline)
    diff = diff_reports(current, baseline)
    md = format_diff_markdown(diff, current, baseline)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(md, encoding="utf-8")
        print(f"Wrote {args.out}", file=sys.stderr)

    print(md)
    if diff.get("meta_mismatch"):
        return 2
    return 1 if any("REGRESSION" in f for f in diff.get("flags", [])) else 0


if __name__ == "__main__":
    raise SystemExit(main())
