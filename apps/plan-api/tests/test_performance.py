"""P3-13: отчёт на верхней границе spec (≤ 8 членов, ≤ 50 строк на раздел) — p95 ≤ 1 с (SPEC_plan-v1 §Success)."""

from __future__ import annotations

import time

from plan_api.analysis.report import build_report
from plan_api.demo import demo_data, demo_members
from plan_api.schemas import Checkup, Member

# Цель spec — p95 ≤ 1 с; локально ~0,3 с. Берём максимум из 5 прогонов, без запаса ниже цели:
# раннер CI вдвое медленнее, а порог 0,5 с давал бы ложные падения
BUDGET_SECONDS = 1.0


def _upper_bound_checkup() -> Checkup:
    members = demo_members() + [Member(id=f"m_a{i}", label=f"Взрослый {i}") for i in range(5)]
    data = demo_data("2026-11")
    for section in ("incomes", "expenses", "liabilities", "savings", "assets", "investments", "pension", "insurance", "goals"):
        rows = getattr(data, section)
        grown = [rows[i % len(rows)] for i in range(50)]
        if section == "liabilities":
            grown = [r.model_copy(update={"id": f"li_{i}"}) for i, r in enumerate(grown)]
        setattr(data, section, grown)
    return Checkup(id="ck_perf", entry_question="mortgage", as_of="2026-11", members=members, data=data)


def test_report_fits_budget_at_upper_bound():
    ck = _upper_bound_checkup()
    assert len(ck.members) == 8 and len(ck.data.liabilities) == 50
    report = build_report(ck)  # прогрев импортов и кешей
    timings = []
    for _ in range(5):
        start = time.perf_counter()
        report = build_report(ck)
        timings.append(time.perf_counter() - start)
    assert len(report["scenarios"]) == 4 and len(report["forecast"]["base"]) == 12
    assert max(timings) <= BUDGET_SECONDS, f"отчёт {max(timings):.3f} с > {BUDGET_SECONDS} с ({sorted(timings)})"
