#!/usr/bin/env bash
set -euo pipefail

# Bootstrap empty PostgreSQL DB:
# - apply schema baseline (DDL-only)
# - run idempotent seeds (reference + catalogs)
#
# Usage:
#   export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
#   bash backend/scripts/bootstrap_db.sh

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (postgresql://...)" >&2
  exit 2
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
baseline="${root_dir}/backend/migrations/0000_schema_baseline.sql"

echo "[1/3] Apply schema baseline: ${baseline}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$baseline"

echo "[2/3] Run seeds (idempotent)"
python "${root_dir}/backend/scripts/seed_db.py"

echo "[3/3] Done"
