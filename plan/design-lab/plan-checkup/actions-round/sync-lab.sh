#!/usr/bin/env bash
set -euo pipefail
ROUND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$ROUND/sync-lab.mjs"
