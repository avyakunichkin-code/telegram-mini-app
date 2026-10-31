#!/usr/bin/env bash
set -euo pipefail

# Move incremental migrations/*.sql (except 0000_*) to migrations/archive/.
#
# Usage:
#   bash backend/scripts/archive_incremental_migrations.sh --whatif
#   bash backend/scripts/archive_incremental_migrations.sh --force

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT}/migrations"
ARCHIVE_DIR="${MIGRATIONS_DIR}/archive"
BASELINE="${MIGRATIONS_DIR}/0000_schema_baseline.sql"

whatif=0
force=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --whatif) whatif=1; shift ;;
    --force) force=1; shift ;;
    *) echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
done

[[ -f "$BASELINE" ]] || { echo "Create baseline first: bash backend/scripts/db.sh baseline-dump (or python ...)" >&2; exit 2; }
mkdir -p "$ARCHIVE_DIR"

mapfile -t candidates < <(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | xargs -n1 basename | sort | grep -vE '^0000_')
if [[ ${#candidates[@]} -eq 0 ]]; then
  echo "No incremental migration files to archive."
  exit 0
fi

echo "Baseline: 0000_schema_baseline.sql"
echo "Move to archive/: ${#candidates[@]} file(s)"
printf '  %s\n' "${candidates[@]}"

if [[ $whatif -eq 1 ]]; then
  echo "[whatif] No changes."
  exit 0
fi

if [[ $force -ne 1 ]]; then
  read -r -p "Continue? (y/N) " confirm
  [[ "$confirm" =~ ^[yY]$ ]] || { echo "Cancelled."; exit 0; }
fi

for f in "${candidates[@]}"; do
  src="${MIGRATIONS_DIR}/${f}"
  dest="${ARCHIVE_DIR}/${f}"
  [[ -e "$dest" ]] && { echo "Already exists: $dest" >&2; exit 2; }
  mv "$src" "$dest"
  echo "[archived] $f"
done

echo "[OK] migrations/ root: 0000_schema_baseline.sql + new migrations only."

