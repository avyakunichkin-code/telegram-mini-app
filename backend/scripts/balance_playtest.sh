#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash backend/scripts/balance_playtest.sh
#   bash backend/scripts/balance_playtest.sh --update-baselines
#   bash backend/scripts/balance_playtest.sh --only mq_game_basic_v1 --only mq_game_debt_stack_v1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --update-baselines) args+=("--update-baselines"); shift ;;
    --only) args+=("--only" "$2"); shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

python "${ROOT}/scripts/balance_playtest.py" "${args[@]}"

