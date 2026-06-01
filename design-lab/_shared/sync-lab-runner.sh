#!/usr/bin/env bash
# Внутренний делегат: stub sync-lab.sh → legacy sync-lab.ps1, пока раунд не портирован на bash.
set -euo pipefail

ROUND="$(cd "${1:?usage: sync-lab-runner.sh <round-dir>}" && pwd)"
SH="$ROUND/sync-lab.sh"
PS1="$ROUND/sync-lab.ps1"

if [[ -f "$SH" ]] && ! grep -q 'sync-lab-runner.sh' "$SH"; then
  exec bash "$SH" "${@:2}"
fi

if [[ ! -f "$PS1" ]]; then
  echo "sync-lab: нет нативного sync-lab.sh и нет sync-lab.ps1 в $ROUND" >&2
  echo "  Добавьте bash sync-lab.sh (см. capital-page/details-actions-round/)" >&2
  exit 1
fi

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -File "$PS1" "${@:2}"
fi
if command -v powershell.exe >/dev/null 2>&1; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1" "${@:2}"
fi
if command -v powershell >/dev/null 2>&1; then
  exec powershell -NoProfile -ExecutionPolicy Bypass -File "$PS1" "${@:2}"
fi

echo "sync-lab: для legacy-раунда нужен pwsh/powershell или порт sync-lab.sh на bash." >&2
exit 127
