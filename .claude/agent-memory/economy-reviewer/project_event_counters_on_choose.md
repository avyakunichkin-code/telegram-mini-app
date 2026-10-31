---
name: event-counters-on-choose
description: once_per_profile counters are recorded only on choose, not on spawn/expire — deterministic (priority) spawns can repeat forever
metadata:
  type: project
---

`record_event_profile_selection` is called only in `backend/app/services/events/choose.py` (on player choice). `expire_pending_events_for_closed_period` (`services/events/spawn.py`) just marks pending → expired without touching counters.

**Why:** any spawn path that is deterministic (e.g. `metadata.spawn_priority_when`) will respawn an ignored once_per_profile event every period and can starve the random pool (EVENTS_PER_PERIOD=2).

**How to apply:** when reviewing new spawn rules (priority, forced, scheduled), check what happens if the player ignores the event; ask for a test "expired → not respawned / pool not starved".

Related trap: several "monthly net" formulas exist — `backend/app/finance/overview_build.py` (net_cashflow excludes burn, includes invest income), fincore `packages/fincore/src/fincore/metrics.py` (income_steady / structural_obligations / lifestyle_burn); flag new ad-hoc duplicates.
