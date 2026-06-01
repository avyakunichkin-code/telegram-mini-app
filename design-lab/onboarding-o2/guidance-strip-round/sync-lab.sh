#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ROOT/sync-lab.ps1" 2>/dev/null || pwsh -NoProfile -File "$ROOT/sync-lab.ps1"
