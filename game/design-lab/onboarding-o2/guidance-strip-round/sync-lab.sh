#!/usr/bin/env bash
set -euo pipefail
ROUND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DL="$(cd "$ROUND/../.." && pwd)"
exec bash "$DL/_shared/sync-lab-runner.sh" "$ROUND" "$@"
