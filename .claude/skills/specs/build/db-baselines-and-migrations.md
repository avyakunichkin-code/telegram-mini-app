# db-baselines-and-migrations — behavioral spec

## Purpose

Enforce PostgreSQL workflow for this repo:

- `0000_schema_baseline.sql` is **DDL-only**
- Incremental `00NN_*.sql` in `migrations/` root (archive is reference-only)
- **Seeds** in `app/seeds/` (including non-ORM catalogs like `victory_goals`); **events** from YAML only
- **`backend/scripts/db.sh`** as the canonical CLI
- Startup: `create_all` + `ensure_schema_compatibility` + `seed_all`

## Trigger examples

- Editing `backend/migrations/*.sql` or regenerating baseline
- Adding/changing `backend/app/seeds/*` or `runner.py`
- Touching `ensure_schema_compatibility()` for new columns/tables
- Reviewing indexes, FK, UNIQUE on natural keys

## Expected outcomes

- Empty DB reaches working API via `db.sh bootstrap` or deploy startup
- No DML in baseline; no event content in SQL migrations
- Non-ORM tables have DDL + seed path documented in skill
- Migrations are idempotent where feasible; data-migrations are labeled and gated

## Negative examples (must reject)

- `INSERT` into baseline for starter templates or victory goals
- Assuming `create_all` creates `victory_goals`
- New event scenario committed only as SQL migration
