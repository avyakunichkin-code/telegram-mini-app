---
name: event-counters-on-choose
description: once_per_profile counters are recorded only on choose, not on spawn/expire — deterministic (priority) spawns can repeat forever
metadata:
  type: project
---

`record_event_profile_selection` is called only in `backend/app/services/events/choose.py` (on player choice). `expire_pending_events_for_closed_period` (`services/events/spawn.py`) just marks pending → expired without touching counters.

**Why:** any spawn path that is deterministic (e.g. `metadata.spawn_priority_when`) will respawn an ignored once_per_profile event every period and can starve the random pool (EVENTS_PER_PERIOD=2).

**Status (2026-11-01):** priority starvation is guarded in `ensure_period_events` — priority applies only to definitions never shown to the profile (`already_shown` from `EventInstance`, review 2026-10-22). Still open: an ignored/expired once_per_profile event stays eligible for the random pool, because the counter is set on choose. Whether "once" means shown or chosen is a spec decision (SPEC events / ADR-008), not a code fix.

**How to apply:** when reviewing new spawn rules (priority, forced, scheduled), check what happens if the player ignores the event; ask for a test "expired → not respawned / pool not starved".

Related trap: several "monthly net" formulas exist — `backend/app/finance/overview_build.py` (net_cashflow excludes burn, includes invest income), fincore `packages/fincore/src/fincore/metrics.py` (income_steady / structural_obligations / lifestyle_burn); flag new ad-hoc duplicates.
