#!/usr/bin/env bash
set -euo pipefail

# Single DB entrypoint (PostgreSQL, no Alembic)
#
# Requires:
#   - DATABASE_URL="postgresql://..."
#   - psql in PATH (for migrate/baseline apply)
#   - Python with backend deps: $PYTHON, else backend/.venv, else python3 / python
#     (Python-скрипты импортируют `app` — запускаются из backend/ с PYTHONPATH=backend)
#
# Commands:
#   db.sh migrate [--baseline-only|--skip-baseline]
#   db.sh seed
#   db.sh events-sync
#   db.sh bootstrap
#   db.sh baseline-dump          (pg_dump via existing dump_schema_baseline.sh)
#   db.sh baseline-verify        (python verify_schema_baseline.py)
#   db.sh archive-incrementals   (move old migrations to migrations/archive/)
#
# Examples:
#   export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
#   bash backend/scripts/db.sh migrate
#   bash backend/scripts/db.sh bootstrap

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT}/migrations"
# PYTHONPATH для нативного Python: на Windows (Git Bash / MSYS) — путь C:\... и разделитель ";"
BACKEND_PYPATH="${ROOT}"
PYTHONPATH_SEP=":"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    PYTHONPATH_SEP=";"
    if command -v cygpath >/dev/null; then BACKEND_PYPATH="$(cygpath -w "${ROOT}")"; fi
    ;;
esac
BASELINE="${MIGRATIONS_DIR}/0000_schema_baseline.sql"

require_env() {
  [[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL is required (postgresql://...)" >&2; exit 2; }
}

require_cmd() {
  command -v "$1" >/dev/null || { echo "$1 not found in PATH" >&2; exit 2; }
}

# Как scripts/dev-setup.ps1: psql не в PATH → $PG_BIN или новейший C:\Program Files\PostgreSQL\*\bin
require_psql() {
  if ! command -v psql >/dev/null; then
    local bin=""
    if [[ -n "${PG_BIN:-}" && -x "${PG_BIN}/psql" || -n "${PG_BIN:-}" && -x "${PG_BIN}/psql.exe" ]]; then
      bin="${PG_BIN}"
    else
      bin="$(ls -d "/c/Program Files/PostgreSQL/"*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
    fi
    [[ -n "${bin}" ]] && export PATH="${bin}:${PATH}"
  fi
  require_cmd psql
}

# Интерпретатор: $PYTHON → backend/.venv (Windows / POSIX) → python3 → python.
# Кандидат должен реально запускаться: на Windows `python`/`python3` из WindowsApps — заглушка Store.
resolve_python() {
  if [[ -n "${PYTHON:-}" ]]; then
    echo "${PYTHON}"
    return 0
  fi
  local c
  for c in "${ROOT}/.venv/Scripts/python.exe" "${ROOT}/.venv/bin/python"; do
    if [[ -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done
  for c in python3 python; do
    if command -v "${c}" >/dev/null && "${c}" -c "import sys" >/dev/null 2>&1; then
      echo "${c}"
      return 0
    fi
  done
  echo "Python not found: create backend/.venv, set PYTHON=..., or install python3" >&2
  exit 2
}

# Запуск backend-скрипта: cwd=backend, PYTHONPATH=backend (+ прежний PYTHONPATH).
run_backend_py() {
  local py
  py="$(resolve_python)"
  (
    cd "${ROOT}"
    PYTHONPATH="${BACKEND_PYPATH}${PYTHONPATH:+${PYTHONPATH_SEP}${PYTHONPATH}}" "${py}" "$@"
  )
}

# Схема уже есть? (baseline не идемпотентен — на живую БД его не гоняем)
schema_exists() {
  local has_schema
  has_schema="$(psql "$DATABASE_URL" -tAc "select to_regclass('public.game_profiles') is not null")"
  [[ "${has_schema//[[:space:]]/}" == "t" ]]
}

mask_url() {
  # mask credentials: postgresql://user:pass@host -> postgresql://***@host
  echo "$DATABASE_URL" | sed -E 's#://[^@]+@#://***@#'
}

cmd_migrate() {
  require_env
  require_psql

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
    # auto: baseline (CREATE TABLE, не идемпотентен) — только на пустую БД;
    # инкременты 00NN_* идемпотентны (IF NOT EXISTS) и гоняются всегда.
    local apply_baseline=0
    if [[ $has_baseline -eq 1 ]] && ! schema_exists; then apply_baseline=1; fi
    for f in "${files[@]}"; do
      if [[ "$f" == 0000_* ]]; then
        [[ $apply_baseline -eq 1 ]] && selected+=("$f")
      else
        selected+=("$f")
      fi
    done
    [[ $has_baseline -eq 1 && $apply_baseline -eq 0 ]] && echo "[info] schema exists — baseline skipped"
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
  run_backend_py "${ROOT}/scripts/seed_db.py"
}

cmd_events_sync() {
  require_env
  run_backend_py "${ROOT}/scripts/sync_events_catalog.py"
}

cmd_bootstrap() {
  require_env
  require_psql

  # migrate (auto): baseline только на пустую БД + все инкременты — иначе seed
  # упадёт на сверке схемы (app/db_schema.py, PR-08).
  echo "[1/2] migrate"
  cmd_migrate
  echo "[2/2] seed (includes events sync)"
  cmd_seed
  echo "[OK] bootstrap complete"
}

cmd_baseline_dump() {
  require_env
  bash "${ROOT}/scripts/dump_schema_baseline.sh"
}

cmd_baseline_verify() {
  run_backend_py "${ROOT}/scripts/verify_schema_baseline.py"
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
  bootstrap
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

