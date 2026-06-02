# db-baselines-and-migrations — behavioral spec

## Purpose

The skill enforces consistent PostgreSQL migration practices for this repository:

- keep `0000_schema_baseline.sql` DDL-only
- keep migrations safe and mostly idempotent
- avoid redundant indexes (especially `id`)
- separate schema migrations from data migrations

## Trigger examples (should use this skill)

- Editing `backend/migrations/0000_schema_baseline.sql`
- Adding `backend/migrations/00xx_*.sql`
- Changing SQLAlchemy models and regenerating baseline
- Reviewing index/constraint changes for performance/consistency

## Expected outcomes

- Baseline contains only `CREATE TABLE/INDEX/CONSTRAINT` for the final schema
- Migrations are readable, ordered, and safe to re-run unless explicitly justified
- Index changes are intentional and not duplicated by PK/UNIQUE
