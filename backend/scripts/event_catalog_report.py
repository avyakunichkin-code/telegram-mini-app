#!/usr/bin/env python3
"""Сводка каталога MVP 1.1 из YAML (для /event-analysis). Запуск: cd backend && python scripts/event_catalog_report.py"""

from __future__ import annotations

import sys
from collections import Counter, defaultdict
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.events.mvp11_catalog import load_mvp11_catalog  # noqa: E402
from app.events.mvp11_contract import validate_mvp11_specs  # noqa: E402

STUDENT_SALARY = 62_500
PRO_SALARY = 100_000


def _max_cash_delta(choices: list[dict]) -> int:
    best = 0
    for ch in choices:
        effects = ch.get("effects") or {}
        if not isinstance(effects, dict):
            continue
        cash = effects.get("cash_delta")
        if isinstance(cash, (int, float)):
            best = max(best, abs(int(cash)))
    return best


def _persona_hint(spec: dict) -> str:
    prereq = spec.get("prerequisites_json") or {}
    if not isinstance(prereq, dict):
        return "any"
    forbid = prereq.get("forbid_active_asset_kinds_any") or []
    require = prereq.get("active_asset_kinds_any") or []
    if "car_personal" in forbid or "car_taxi" in forbid:
        return "student-leaning"
    if "car_personal" in require:
        return "pro-leaning"
    return "any"


def main() -> None:
    specs, taxonomy = load_mvp11_catalog(force_reload=True)
    try:
        validate_mvp11_specs(specs)
        contract = "ok"
    except AssertionError as e:
        contract = f"FAIL: {e}"

    by_tier: Counter[int] = Counter()
    by_domain: Counter[str] = Counter()
    inactive: list[str] = []
    persona: dict[str, str] = {}

    for spec in specs:
        key = spec["key"]
        by_tier[int(spec.get("event_tier", 1))] += 1
        meta = taxonomy.get(key) or {}
        by_domain[str(meta.get("event_domain", "?"))] += 1
        if int(spec.get("is_active", 1)) == 0:
            inactive.append(key)
        persona[key] = _persona_hint(spec)

    print("=== MVP 1.1 event catalog ===")
    print(f"total: {len(specs)}")
    print(f"contract validate_mvp11_specs: {contract}")
    print(f"inactive: {', '.join(inactive) or '(none)'}")
    print()
    print("by tier:", dict(sorted(by_tier.items())))
    print("by domain:", dict(sorted(by_domain.items())))
    print()
    print("--- events (tier, domain, max|cash|, %salary student/pro, persona) ---")
    for spec in sorted(specs, key=lambda s: s["key"]):
        key = spec["key"]
        meta = taxonomy.get(key) or {}
        tier = int(spec.get("event_tier", 1))
        domain = meta.get("event_domain", "?")
        max_cash = _max_cash_delta(spec.get("choices") or [])
        pct_s = round(100 * max_cash / STUDENT_SALARY, 1) if max_cash else 0
        pct_p = round(100 * max_cash / PRO_SALARY, 1) if max_cash else 0
        print(
            f"{key}\tT{tier}\t{domain}\t{max_cash}\t{pct_s}%\t{pct_p}%\t{persona[key]}"
        )

    chain_like = [s["key"] for s in specs if "callback" in s["key"] or "deadline" in s["key"]]
    if chain_like:
        print()
        print("chain followups:", ", ".join(sorted(chain_like)))

    student_only = [k for k, p in persona.items() if p == "student-leaning"]
    pro_only = [k for k, p in persona.items() if p == "pro-leaning"]
    if student_only:
        print("student-leaning prereq:", ", ".join(sorted(student_only)))
    if pro_only:
        print("pro-leaning prereq:", ", ".join(sorted(pro_only)))


if __name__ == "__main__":
    main()
