---
name: fincore-burn-parity-traps
description: Where lifestyle burn logic is duplicated between game adapter and fincore (SPL-204) — drift points to check on any burn change
metadata:
  type: project
---

Lifestyle burn lives in `packages/fincore/src/fincore/expenses.py::monthly_burn`; game adapters are `backend/app/finance/expenses.py::compute_monthly_burn` and `backend/app/game/adapters/fincore_snapshot.py::_expense_lines` (the latter still clamps/rounds/title-fallbacks lines itself — duplicate logic).

**Why:** ADR-016 SPL gate demands bit-identical numbers; by_category sums unrounded amounts while lines_sum sums rounded ones; `legacy_delta` in BurnSnapshot is the profile delta, not the core `extra` (which may be base budget via `lifestyle_extra`).
**How to apply:** on any burn/expense change, check both adapters plus `tests/unit/game/test_fincore_metrics_parity.py` and golden `tests/golden/`. `fincore.metrics.compute_metrics` (as of 2026-10) is used only by parity tests, not the game prod path.

**SPL-205 month_step (2026-10):** close money math is in `packages/fincore/src/fincore/month.py::month_step`; `game/period.py` only applies postings via `adjust_balance` with `type=posting.kind` (fincore kind strings == game transaction types — rename in core silently changes journal). Liability `paid` comes from the core ledger (snapshot cash), not DB re-read; safe only while `time/next` holds the profile FOR UPDATE. `services/insurance/service.py::expire_policies_for_period` calls `db.commit()` mid-close (pre-existing). Insurance savepoint failure → `MonthResult.cash_end` != profile cash by design.
