---
name: needs-set-point-review-traps
description: Traps when reviewing needs set_point model (SPEC_needs-set-point, ADR-015) — invariant, starter assets, close try/except, headroom previews
metadata:
  type: project
---

Needs set_point model lives in `backend/app/needs/set_point.py`; config parsed inside `parse_needs_config` (`needs/engine.py`), which also runs on period close (`game/period.py::_apply_needs_decay`) — any raise there silently stops needs decay for BOTH models (try/except + db.refresh).

- Stressors are now clamped to <=0 in `parse_set_point_config`; `category_axes` overrides are still not sign-checked.
- Starter assets matched by kind+asset_value; `leased_dwelling` has asset_value 0 in seeds, so any new leased dwelling matches the starter twin (rent ignored).
- `FinanceAsset.acquired_period_index` (migration 0049): NULL = period 1; every new `FinanceAsset(` site must set it (chains.py, acquisitions.py, assets.py x2, start.py).
- Headroom (`gain_with_headroom`) applies only in choose.py / treat_self.py when model=set_point; previews (`events/payload.py`, overview treat_self options) still show raw needs_delta.
- Model check in choose/treat_self uses literal "set_point", period.py uses `MODEL_SET_POINT` — keep in sync.
- Event `expense_line.category_key: entertainment` is coerced to `other` (`finance/expenses.py` add_expense_line_from_event); `housing` has no needs axes.
- Test DB templates lack `needs` block — tests patch via `tests/test_character_needs.py::_patch_template_needs`.
- Distressed cash penalty is NOT implemented anywhere (parsed in `needs/engine.py`, overview `needs_distressed_penalty_estimate=0` hardcoded); any copy mentioning «штраф» for needs is wrong.
- Blueprint is re-read from template at every close (`game/period.py::_apply_needs_decay`) → switching a seed's `needs.model` also switches in-flight saves.
- Baseline `main__student_safety_first_40p` dies by cash at p3 since 8711366 (bot bug) — useless as regression guard; tutorial/idle baselines pick the same choices.
- `needs/set_point.py::_assets_for_profile` result is ORDER-DEPENDENT (greedy starter-twin match in `compute_level` + per-asset habituation) — needs ORDER BY id; `tests/fixtures/game.py::create_profile_ready_for_period_close` has no template row, so `_apply_needs_decay` returns early and close tests skip needs.
- Run tests with `py -3 -m pytest` from backend/ (as of 2026-10-22 backend/.venv lacks `fincore` -> collection errors); ad-hoc scripts need `PYTHONPATH=.`.

**Why:** recurring review surface for NV plan steps 3–5.
**How to apply:** on later NV steps (template switch NV-406, catalog recalibration step 5), re-check these edges first.
