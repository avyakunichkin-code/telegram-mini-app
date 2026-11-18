#!/usr/bin/env python3
"""
Перекалибровка needs_delta каталога mvp11 под кривую цены (SPEC_needs-set-point, PLAN NV-502…504).

Правила:
  pleasure (разовая трата на удовольствие) — сумма плюсов = needs_points(цена, S), доли осей
      сохраняются, ось ≤ 10; у событий для всех персон цена переводится в cash_pct_salary.
  отказ (cash ≥ 0, без регулярных расходов) — сумма минусов ≤ 40% лучшего плюса события
      (только уменьшение).
  mitigation / investment (события из PURPOSE_BY_EVENT) — платный выбор помечается purpose,
      плюсы ≤ 3 на ось и ≤ 4 в сумме.
  регулярная трата (expense_line, рост расходов) — разовые плюсы ≤ needs_points(платёж в месяц, S).
  Не трогаем: цепочки (enqueue / chain branch / used_car), страховые выплаты, safety_grant, доход.

Правка точечная по строкам: комментарии и переносы YAML сохраняются.

  python scripts/needs_recalibrate_catalog.py --dry-run          # отчёт без записи
  python scripts/needs_recalibrate_catalog.py --k 25             # записать YAML
"""

from __future__ import annotations

import argparse
import glob
import math
import re
import sys
from pathlib import Path

import yaml

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
CATALOG = REPO / "data" / "events" / "mvp11"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.needs.value_curve import needs_points  # noqa: E402

AXES = ("comfort", "status", "social", "health")
REF_SALARY = 62_500.0
SALARY_BY_TEMPLATE = {
    "mq_game_basic_v1": 62_500.0,
    "mq_game_tight_budget_v1": 100_000.0,
    "mq_game_mortgage_stress_v1": 150_000.0,
    "mq_game_debt_stack_v1": 200_000.0,
}
PLEASURE_AXIS_CAP = 15
REFUSAL_SHARE = 0.4
NON_PLEASURE_AXIS_CAP = 3
NON_PLEASURE_TOTAL_CAP = 4
PCT_STEP = 0.005

PURPOSE_BY_EVENT = {
    "mq11_car_accident": "mitigation",
    "mq11_home_water_damage": "mitigation",
    "mq11_sprain_leg": "mitigation",
    "mq11_hoa_assessment_manager": "mitigation",
    "mq11_family_car_repair_manager": "mitigation",
    "mq11_car_service_pro": "mitigation",
    "mq11_card_minimum_entrepreneur": "mitigation",
    "mq11_vendor_payment_entrepreneur": "mitigation",
    "mq11_refinance_bank": "investment",
    "mq11_mortgage_prepay_pro": "investment",
    "mq11_portfolio_rebalance": "investment",
}

SKIP_KEYS = ("enqueue_event", "requires_chain_branch", "used_car_action", "insurance_claim", "safety_grant")


def _temporary_line_cost(e: dict) -> float:
    """Строка расходов с expires_after_periods — по сути разовая трата: сумма за срок."""
    line = e.get("expense_line")
    if not isinstance(line, dict) or not line.get("expires_after_periods"):
        return 0.0
    return float(line.get("amount_monthly", line.get("amount", 0)) or 0) * int(line["expires_after_periods"])


def _recurring_monthly(e: dict) -> float:
    m = max(0.0, float(e.get("monthly_lifestyle_delta") or 0)) + max(0.0, float(e.get("monthly_expense_delta") or 0))
    line = e.get("expense_line")
    if isinstance(line, dict) and not line.get("expires_after_periods"):
        m += max(0.0, float(line.get("amount_monthly", line.get("amount", 0)) or 0))
    return m


def _distribute(total: float, weights: dict[str, float], cap: float) -> dict[str, int]:
    """Целые доли total по весам (наибольший остаток), каждая ось ≤ cap, у ненулевого веса ≥ 1."""
    if total <= 0 or not weights:
        return {ax: 0 for ax in weights}
    wsum = sum(weights.values())
    target = int(round(total))
    raw = {ax: min(cap, target * w / wsum) for ax, w in weights.items()}
    out = {ax: int(math.floor(v)) for ax, v in raw.items()}
    rest = min(target, int(cap * len(weights))) - sum(out.values())
    for ax in sorted(raw, key=lambda a: raw[a] - out[a], reverse=True):
        if rest <= 0:
            break
        if out[ax] < cap:
            out[ax] += 1
            rest -= 1
    return {ax: max(1, v) for ax, v in out.items()}


def _scale_down(values: dict[str, int], axis_cap: int, total_cap: int) -> dict[str, int]:
    capped = {ax: min(axis_cap, v) for ax, v in values.items()}
    s = sum(capped.values())
    if s <= total_cap:
        return capped
    return _distribute(total_cap, {ax: float(v) for ax, v in capped.items() if v > 0}, axis_cap)


def plan_event(ev: dict, k: float) -> list[dict]:
    """Список правок по выборам события: {idx, title, needs, cash_pct, purpose, rule}."""
    key = ev["definition_key"]
    aud = [a for a in (ev.get("audience_template_keys") or ["all"]) if a]
    for_all = not aud or "all" in aud
    salary = REF_SALARY if for_all else min(SALARY_BY_TEMPLATE.get(a, REF_SALARY) for a in aud)
    event_purpose = PURPOSE_BY_EVENT.get(key)
    choices = ev.get("choices") or []
    edits: list[dict] = []
    best_pleasure = 0

    for idx, ch in enumerate(choices):
        e = ch.get("effects") or {}
        nd = {ax: float(v) for ax, v in (e.get("needs_delta") or {}).items()}
        plus = {ax: v for ax, v in nd.items() if v > 0}
        minus = {ax: v for ax, v in nd.items() if v < 0}
        cash = float(e.get("cash_delta") or 0)
        if any(e.get(s) is not None for s in SKIP_KEYS) or e.get("monthly_burn_delta_pct") is not None:
            continue
        monthly = _recurring_monthly(e)
        temp_cost = _temporary_line_cost(e)
        if (cash < 0 or temp_cost > 0) and monthly <= 0 and float(e.get("monthly_lifestyle_delta") or 0) >= 0:
            cost = max(0.0, -cash) + temp_cost
            if event_purpose:
                if plus:
                    new_plus = _scale_down({ax: int(v) for ax, v in plus.items()}, NON_PLEASURE_AXIS_CAP, NON_PLEASURE_TOTAL_CAP)
                    edits.append({"idx": idx, "title": ch["title"], "needs": {**{ax: int(v) for ax, v in minus.items()}, **new_plus},
                                  "purpose": event_purpose, "rule": event_purpose, "cost": cost})
                else:
                    edits.append({"idx": idx, "title": ch["title"], "needs": None, "purpose": event_purpose, "rule": event_purpose})
                continue
            if not plus:
                continue
            pct = None
            # Сумма в названии («Перевести 8 000 ₽») — цену оставляем в рублях, иначе текст врёт.
            if for_all and temp_cost <= 0 and "₽" not in str(ch.get("title") or ""):
                pct = max(PCT_STEP, round(cost / REF_SALARY / PCT_STEP) * PCT_STEP)
                pct = round(pct, 3)
                cost = pct * REF_SALARY
            total = needs_points(cost, REF_SALARY if pct is not None else salary, k=k)
            new_plus = _distribute(total, plus, PLEASURE_AXIS_CAP)
            best_pleasure = max(best_pleasure, sum(new_plus.values()))
            edits.append({"idx": idx, "title": ch["title"], "needs": {**{ax: int(v) for ax, v in minus.items()}, **new_plus},
                          "cash_pct": pct, "rule": "pleasure", "cost": cost})
        elif monthly > 0 and plus:
            cap_total = needs_points(monthly, salary, k=k)
            s = sum(plus.values())
            if s > cap_total:
                new_plus = _distribute(cap_total, plus, PLEASURE_AXIS_CAP)
                edits.append({"idx": idx, "title": ch["title"], "needs": {**{ax: int(v) for ax, v in minus.items()}, **new_plus},
                              "rule": "recurring"})

    _enforce_monotonic(edits)
    best_pleasure = max([sum(v for v in (ed["needs"] or {}).values() if v > 0) for ed in edits if ed["rule"] == "pleasure"] or [0])

    if best_pleasure > 0:
        limit = max(1, int(round(REFUSAL_SHARE * best_pleasure)))
        for idx, ch in enumerate(choices):
            e = ch.get("effects") or {}
            if any(e.get(s) is not None for s in SKIP_KEYS) or _recurring_monthly(e) > 0:
                continue
            if float(e.get("cash_delta") or 0) < 0 or e.get("monthly_lifestyle_delta") is not None:
                continue
            nd = {ax: float(v) for ax, v in (e.get("needs_delta") or {}).items()}
            minus = {ax: -v for ax, v in nd.items() if v < 0}
            if sum(minus.values()) <= limit:
                continue
            new_minus = _distribute(limit, minus, 100)
            plus = {ax: int(v) for ax, v in nd.items() if v > 0}
            edits.append({"idx": idx, "title": ch["title"], "needs": {**plus, **{ax: -v for ax, v in new_minus.items()}},
                          "rule": "refusal"})
    return edits


def _enforce_monotonic(edits: list[dict]) -> None:
    """Дешёвый вариант события даёт строго меньше плюсов, чем более дорогой (иначе Pareto-доминирование)."""
    for rule in ("pleasure", "mitigation", "investment"):
        paid = [ed for ed in edits if ed["rule"] == rule and ed.get("needs") and ed.get("cost")]
        paid.sort(key=lambda ed: ed["cost"], reverse=True)
        ceiling = None
        for ed in paid:
            plus = {ax: v for ax, v in ed["needs"].items() if v > 0}
            total = sum(plus.values())
            if ceiling is not None and total >= ceiling and plus:
                new_total = max(len(plus), ceiling - 1)
                ed["needs"] = {**{ax: v for ax, v in ed["needs"].items() if v < 0},
                               **_distribute(new_total, {ax: float(v) for ax, v in plus.items()}, PLEASURE_AXIS_CAP)}
                total = sum(v for v in ed["needs"].values() if v > 0)
            ceiling = total if ceiling is None else min(ceiling, total)


# ---------- Точечная правка YAML ----------

EVENT_RE = re.compile(r"^- definition_key: (\S+)\s*$")
TITLE_RE = re.compile(r"^  - title: ")
CASH_RE = re.compile(r"^      cash_delta: (-?[\d.]+)\s*$")
ND_RE = re.compile(r"^      needs_delta:\s*$")
AXIS_RE = re.compile(r"^        (comfort|status|social|health): ")


def _index_file(lines: list[str]) -> dict[str, list[dict]]:
    """definition_key → список выборов с номерами строк."""
    out: dict[str, list[dict]] = {}
    cur = None
    for i, line in enumerate(lines):
        m = EVENT_RE.match(line)
        if m:
            cur = m.group(1)
            out[cur] = []
            continue
        if cur is None:
            continue
        if TITLE_RE.match(line):
            out[cur].append({"title_line": i, "cash_line": None, "nd_line": None, "axis_lines": []})
            continue
        if not out[cur]:
            continue
        ch = out[cur][-1]
        if CASH_RE.match(line):
            ch["cash_line"] = i
        elif ND_RE.match(line):
            ch["nd_line"] = i
        elif ch["nd_line"] is not None and AXIS_RE.match(line) and i == (ch["axis_lines"][-1] if ch["axis_lines"] else ch["nd_line"]) + 1:
            ch["axis_lines"].append(i)
    return out


def apply_edits(path: Path, edits_by_key: dict[str, list[dict]]) -> int:
    lines = path.read_text(encoding="utf-8").split("\n")
    index = _index_file(lines)
    ops: list[tuple[int, str, object]] = []  # (line, op, payload)
    n = 0
    for key, edits in edits_by_key.items():
        if key not in index:
            continue
        for ed in edits:
            ch = index[key][ed["idx"]]
            if ed.get("needs") is not None and ch["nd_line"] is not None:
                new_lines = [f"        {ax}: {v}" for ax, v in ed["needs"].items() if v != 0]
                ops.append((ch["nd_line"], "replace_axes", (ch["axis_lines"], new_lines)))
            if ed.get("cash_pct") is not None and ch["cash_line"] is not None:
                ops.append((ch["cash_line"], "set", f"      cash_pct_salary: {ed['cash_pct']:g}"))
            if ed.get("purpose"):
                ops.append((ch["title_line"], "after", f"    purpose: {ed['purpose']}"))
            n += 1
    for line_no, op, payload in sorted(ops, key=lambda o: o[0], reverse=True):
        if op == "set":
            lines[line_no] = payload  # type: ignore[assignment]
        elif op == "after":
            nxt = lines[line_no + 1] if line_no + 1 < len(lines) else ""
            if not nxt.startswith("    purpose:"):
                lines.insert(line_no + 1, payload)  # type: ignore[arg-type]
        elif op == "replace_axes":
            old, new = payload  # type: ignore[misc]
            if old:
                del lines[old[0] : old[-1] + 1]
            for j, nl in enumerate(new):
                lines.insert(line_no + 1 + j, nl)
    path.write_text("\n".join(lines), encoding="utf-8")
    return n


def main(argv: list[str] | None = None) -> int:
    global PLEASURE_AXIS_CAP, REFUSAL_SHARE
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--k", type=float, default=40.0, help="масштаб кривой K_imp")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--axis-cap", type=int, default=PLEASURE_AXIS_CAP, help="потолок плюса на ось (pleasure)")
    ap.add_argument("--refusal-share", type=float, default=REFUSAL_SHARE, help="минус отказа ≤ доля лучшего плюса")
    args = ap.parse_args(argv)
    PLEASURE_AXIS_CAP, REFUSAL_SHARE = args.axis_cap, args.refusal_share

    total = 0
    for f in sorted(glob.glob(str(CATALOG / "**" / "*.yaml"), recursive=True)):
        data = yaml.safe_load(Path(f).read_text(encoding="utf-8")) or {}
        edits_by_key: dict[str, list[dict]] = {}
        for ev in data.get("events") or []:
            if not isinstance(ev, dict) or not ev.get("choices"):
                continue
            edits = plan_event(ev, args.k)
            if not edits:
                continue
            edits_by_key[ev["definition_key"]] = edits
            for ed in edits:
                ch = ev["choices"][ed["idx"]]
                old = (ch.get("effects") or {}).get("needs_delta")
                pct = f" pct={ed['cash_pct']:g}" if ed.get("cash_pct") is not None else ""
                print(f"{ed['rule']:10} {ev['definition_key']} :: {ed['title']} | {old} -> {ed.get('needs')}{pct}")
        if edits_by_key and not args.dry_run:
            total += apply_edits(Path(f), edits_by_key)
        else:
            total += sum(len(v) for v in edits_by_key.values())
    print(f"\n{'(dry-run) ' if args.dry_run else ''}правок: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
