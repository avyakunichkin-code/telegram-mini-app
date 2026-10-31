# guidance-onboarding — behavioral spec

## Purpose

Keep O3 onboarding guidance consistent across backend and frontend:

- Spine beats live in `backend/app/guidance/curriculum.py`, triggers in `triggers.py`; FE `src/guidance/curriculum.js` is a **mirror** (ids, order, gates, `MIN_PERIOD_INDEX_FOR_GAME_EVENTS`)
- Progress is per **user** (`User.guidance_progress_json`), finalised by `complete_guidance` (sets profile `onboarding_state/step`)
- Period-close hooks (`update_nudge_streaks_on_period_close`, `on_period_closed_guidance`) never break `process_period_end`
- Player-visible changes go through `SPEC_onboarding-o3.md` first

## Trigger examples

- Add or reword a beat / trigger / Monetka text
- New gate kind or PATCH `/api/game/guidance` action
- New nudge after guidance (`salary_miss_streak`, `negative_close_streak`)
- Guidance strip, anchors (`data-onboarding-anchor`) or event/period-close blocking rules in FE

## Expected outcomes

- Backend and FE curriculum stay in sync; renamed ids come with a progress mapping (like `O2_BEAT_TO_TRIGGER`)
- New non-screen trigger has an eligibility branch in `_trigger_eligible`
- `pytest -k "guidance or onboarding"` green; FE `npm run test:guidance` green (part of `npm run test:unit`)
- Known code pitfalls (GET commits the auto-gate sync, spec vs code drift) are reported, not silently "fixed" out of scope
- Onboarding completion (`complete_guidance`, ops alert) stays in PATCH actions; GET never completes guidance

## Negative examples (must reject)

- Adding a beat only in `curriculum.py` (or only in FE `curriculum.js`)
- Renaming a beat id without migrating stored progress
- Making economy or victory depend on guidance state
- Calling `build_guidance_overview` inside an uncommitted foreign transaction
