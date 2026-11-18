---
name: preview-vs-close-expiry-gap
description: Period close preview (fincore.forecast months=1) skips expire_expense_lines_for_period, so backfill-from-base can diverge from real close in an edge case
metadata:
  type: project
---

Since SPL-206 (2026-10), `backend/app/finance/period_close_preview.py` = `fincore.forecast(months=1)` over `build_household_snapshot`, and is asserted equal to real close by `test_preview_matches_actual_close` (tests/unit/game/test_period_close_golden.py).
Known gap: close runs `expire_expense_lines_for_period` BEFORE `ensure_profile_expense_lines`; preview cannot (read-only), so if every active line expires this period, close backfills from base while preview uses only `lifestyle_extra` (delta). Golden scenarios do not cover it.

**Why:** the preview is claimed "equal to close"; this is the one known path where it is not.
**How to apply:** when reviewing preview/close/expense-line changes, check this ordering and whether a scenario covers it. See also [[event-counters-on-choose]].
