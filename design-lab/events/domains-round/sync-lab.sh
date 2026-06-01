#!/usr/bin/env bash
set -euo pipefail
ROUND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVENTS="$(cd "$ROUND/.." && pwd)"
exec bash "$EVENTS/_shared/sync-lab-round.sh" "$ROUND" "$@"
