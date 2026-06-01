import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const designLab = path.join(repoRoot, 'design-lab')
const stub = fs.readFileSync(path.join(designLab, '_shared', 'sync-lab-round.sh'), 'utf8')
const eventsStub = `#!/usr/bin/env bash
set -euo pipefail
ROUND="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
EVENTS="$(cd "$ROUND/.." && pwd)"
exec bash "$EVENTS/_shared/sync-lab-round.sh" "$ROUND" "$@"
`

function findRoundDirs(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue
    const abs = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      findRoundDirs(abs, out)
      continue
    }
    if (ent.name === 'index.html') {
      out.push(path.dirname(abs))
    }
  }
  return out
}

let n = 0
for (const roundDir of [...new Set(findRoundDirs(designLab))]) {
  const shPath = path.join(roundDir, 'sync-lab.sh')
  if (fs.existsSync(shPath)) continue

  const rel = path.relative(designLab, roundDir).replaceAll('\\', '/')
  const body = rel.startsWith('events/') ? eventsStub : stub
  fs.writeFileSync(shPath, body, 'utf8')
  n += 1
}

// eslint-disable-next-line no-console
console.log(`OK: added sync-lab.sh in ${n} round dirs (skipped existing).`)
