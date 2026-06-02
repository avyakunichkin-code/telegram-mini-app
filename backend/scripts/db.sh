#!/usr/bin/env bash
set -euo pipefail

# Single DB entrypoint (PostgreSQL, no Alembic)
#
# Requires:
#   - DATABASE_URL="postgresql://..."
#   - psql in PATH (for migrate/baseline apply)
#
# Commands:
#   db.sh migrate [--baseline-only|--skip-baseline]
#   db.sh seed
#   db.sh events-sync
#   db.sh bootstrap [--with-events]
#   db.sh baseline-dump          (pg_dump via existing dump_schema_baseline.sh)
#   db.sh baseline-verify        (python verify_schema_baseline.py)
#   db.sh archive-incrementals   (move old migrations to migrations/archive/)
#
# Examples:
#   export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
#   bash backend/scripts/db.sh migrate
#   bash backend/scripts/db.sh bootstrap --with-events

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT}/migrations"
BASELINE="${MIGRATIONS_DIR}/0000_schema_baseline.sql"

require_env() {
  [[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL is required (postgresql://...)" >&2; exit 2; }
}

require_cmd() {
  command -v "$1" >/dev/null || { echo "$1 not found in PATH" >&2; exit 2; }
}

mask_url() {
  # mask credentials: postgresql://user:pass@host -> postgresql://***@host
  echo "$DATABASE_URL" | sed -E 's#://[^@]+@#://***@#'
}

cmd_migrate() {
  require_env
  require_cmd psql

  local mode="auto"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --baseline-only) mode="baseline-only"; shift ;;
      --skip-baseline) mode="skip-baseline"; shift ;;
      *) echo "Unknown migrate flag: $1" >&2; exit 2 ;;
    esac
  done

  [[ -d "${MIGRATIONS_DIR}" ]] || { echo "migrations dir not found: ${MIGRATIONS_DIR}" >&2; exit 2; }

  mapfile -t files < <(ls -1 "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | xargs -n1 basename | sort)
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "[info] No migrations/*.sql files"
    return 0
  fi

  local has_baseline=0
  local inc_count=0
  for f in "${files[@]}"; do
    if [[ "$f" == 0000_* ]]; then has_baseline=1; else inc_count=$((inc_count+1)); fi
  done

  local selected=()
  if [[ "$mode" == "baseline-only" ]]; then
    [[ -f "${BASELINE}" ]] || { echo "Baseline not found: ${BASELINE}" >&2; exit 2; }
    selected=("$(basename "${BASELINE}")")
  elif [[ "$mode" == "skip-baseline" ]]; then
    for f in "${files[@]}"; do [[ "$f" == 0000_* ]] || selected+=("$f"); done
  else
    if [[ $has_baseline -eq 1 && $inc_count -eq 0 ]]; then
      echo "[info] Baseline mode: only 0000_schema_baseline.sql"
      selected=("$(basename "${BASELINE}")")
    else
      selected=("${files[@]}")
    fi
  fi

  echo "DATABASE_URL: $(mask_url)"
  echo "Migrations to apply: ${#selected[@]}"
  for f in "${selected[@]}"; do
    echo "[migrate] ${f} ..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${MIGRATIONS_DIR}/${f}"
  done
  echo "[OK] Migrations applied"
}

cmd_seed() {
  require_env
  python "${ROOT}/scripts/seed_db.py"
}

cmd_events_sync() {
  require_env
  python "${ROOT}/scripts/sync_events_catalog.py"
}

cmd_bootstrap() {
  require_env
  require_cmd psql

  local with_events=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --with-events) with_events=1; shift ;;
      *) echo "Unknown bootstrap flag: $1" >&2; exit 2 ;;
    esac
  done

  echo "[1/3] migrate --baseline-only"
  cmd_migrate --baseline-only
  echo "[2/3] seed"
  cmd_seed
  if [[ $with_events -eq 1 ]]; then
    echo "[3/3] events-sync"
    cmd_events_sync
  else
    echo "[3/3] skip events-sync (use --with-events)"
  fi
  echo "[OK] bootstrap complete"
}

cmd_baseline_dump() {
  require_env
  bash "${ROOT}/scripts/dump_schema_baseline.sh"
}

cmd_baseline_verify() {
  python "${ROOT}/scripts/verify_schema_baseline.py"
}

cmd_archive_incrementals() {
  bash "${ROOT}/scripts/archive_incremental_migrations.sh" "$@"
}

usage() {
  cat <<EOF
Usage:
  bash backend/scripts/db.sh <command> [args]

Commands:
  migrate [--baseline-only|--skip-baseline]
  seed
  events-sync
  bootstrap [--with-events]
  baseline-dump
  baseline-verify
  archive-incrementals [--whatif|--force]
EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    migrate) cmd_migrate "$@" ;;
    seed) cmd_seed "$@" ;;
    events-sync) cmd_events_sync "$@" ;;
    bootstrap) cmd_bootstrap "$@" ;;
    baseline-dump) cmd_baseline_dump "$@" ;;
    baseline-verify) cmd_baseline_verify "$@" ;;
    archive-incrementals) cmd_archive_incrementals "$@" ;;
    ""|-h|--help|help) usage ;;
    *) echo "Unknown command: $cmd" >&2; usage; exit 2 ;;
  esac
}

main "$@"

