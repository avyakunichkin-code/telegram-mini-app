#!/usr/bin/env bash
set -euo pipefail

file="${1:-}"

if [[ -z "${file}" ]]; then
  echo "Usage: $0 path/to/0000_schema_baseline.sql" >&2
  exit 2
fi

if [[ ! -f "${file}" ]]; then
  echo "File not found: ${file}" >&2
  exit 2
fi

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# Baseline must be DDL-only.
if grep -nE '^[[:space:]]*(INSERT|UPDATE|DELETE)[[:space:]]+' "${file}" >/dev/null; then
  fail "Baseline contains DML (INSERT/UPDATE/DELETE)."
fi

# Avoid incremental-migration concatenation markers.
if grep -nE '^[[:space:]]*--[[:space:]]*>>>[[:space:]]*[0-9]{4}_.+\.sql' "${file}" >/dev/null; then
  fail "Baseline contains incremental migration markers (-- >>> 00xx_*.sql)."
fi

# Avoid redundant id indexes when PK exists (heuristic).
if grep -nE '^[[:space:]]*CREATE[[:space:]]+(UNIQUE[[:space:]]+)?INDEX[[:space:]]+[^;]+[[:space:]]+ON[[:space:]]+[^;]+\\([[:space:]]*id[[:space:]]*\\)' "${file}" >/dev/null; then
  fail "Baseline contains explicit indexes on (id). PK already indexes id."
fi

echo "OK: ${file}"
