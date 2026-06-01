#!/usr/bin/env bash
# Stub в раунде без нативного sync: делегат на sync-lab-runner (legacy ps1 → порт на bash).
set -euo pipefail
ROUND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
d="$ROUND"
while [[ "$d" != "/" ]]; do
  if [[ "$(basename "$d")" == "design-lab" ]]; then
    exec bash "$d/_shared/sync-lab-runner.sh" "$ROUND" "$@"
  fi
  d="$(dirname "$d")"
done
echo "sync-lab.sh: не найден design-lab/_shared/sync-lab-runner.sh" >&2
exit 1
