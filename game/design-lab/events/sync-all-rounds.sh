#!/usr/bin/env bash
# Пересобрать lab-base.css + assets во всех раундах events/
set -euo pipefail

EVENTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC="$EVENTS/_shared/sync-lab-round.sh"

for round in layout-round overlay-round domains-round tails-round; do
  bash "$SYNC" "$EVENTS/$round"
done

echo "Done: layout-round, overlay-round, domains-round, tails-round"
