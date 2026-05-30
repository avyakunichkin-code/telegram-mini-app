#!/usr/bin/env bash
# Запуск sync-lab.ps1 из bash / Git Bash / WSL (Windows: pwsh или powershell).
set -euo pipefail

ROUND="$(cd "${1:?usage: sync-lab-runner.sh <round-dir>}" && pwd)"
PS1="$ROUND/sync-lab.ps1"

if [[ ! -f "$PS1" ]]; then
  echo "sync-lab: нет файла $PS1" >&2
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

echo "sync-lab: не найден pwsh/powershell в PATH." >&2
echo "  Windows: winget install Microsoft.PowerShell" >&2
echo "  Или из PowerShell: .\\sync-lab.ps1" >&2
echo "  Или: cd frontend-react && npm run design-lab:sync-round -- <путь-к-раунду>" >&2
exit 127
