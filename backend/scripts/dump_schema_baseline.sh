#!/usr/bin/env bash
# Schema-only baseline → migrations/0000_schema_baseline.sql
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/migrations/0000_schema_baseline.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

command -v pg_dump >/dev/null || { echo "pg_dump not found" >&2; exit 1; }

STAMP="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
{
  cat <<EOF
-- Schema baseline: ТВОЙ ХОД (PostgreSQL)
-- Generated: $STAMP
-- Regenerate: backend/scripts/dump_schema_baseline.sh
-- Apply empty DB only: migrate.ps1 -BaselineOnly (Windows) or see migrations/README.md
--
-- DDL only. Reference data: main.py seeds + data/events/mvp11 YAML sync.
--

EOF
  pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges --no-tablespaces
} > "$OUT"

echo "[OK] Baseline written -> $OUT"
