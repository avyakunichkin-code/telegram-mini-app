---
name: money-metrics-single-source
description: Since SPL-207b overview + victory input money fields come from fincore.metrics via household_metrics; run_finale.py still has its own copy of the formula
metadata:
  type: project
---

Overview (`backend/app/finance/overview_build.py`) and victory input (`backend/app/victory/snap.py`) take money metrics from `fincore.metrics.compute_metrics` via `household_metrics` / `prepared_household_snapshot` (`backend/app/game/adapters/fincore_snapshot.py`, which also does the expense-line backfill that `compute_monthly_burn` does).
Victory keeps the salary base for the `expense_to_income_ratio` goal (engine uses `monthly_salary`) and net cashflow WITHOUT invest projection; overview uses the version WITH projection.
`backend/app/game/run_finale.py` (around lines 185-215) still recomputes passive/invest income by hand — a duplicate formula that can drift.

**Why:** ADR-009 §4 says one formula per metric; the parity test `backend/tests/unit/game/test_fincore_metrics_parity.py` now only checks which field maps to which metric (both sides use the same code).
**How to apply:** when a diff touches money metrics, check run_finale and any new hand-written sums; the parity test will not catch a formula drift in the core itself (rely on balance_playtest baselines instead).
