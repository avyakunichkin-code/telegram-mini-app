import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const roundArg = process.argv[2]

if (!roundArg) {
  // eslint-disable-next-line no-console
  console.error(
    [
      'Usage: npm run design-lab:sync-round -- <round-path>',
      '',
      'Examples:',
      '  npm run design-lab:sync-round -- design-lab/character-needs/dashboard-needs-v5-round',
      '  npm run design-lab:sync-round -- ../design-lab/dashboard/hero-no-timer-round',
    ].join('\n'),
  )
  process.exit(1)
}

const roundDir = path.isAbsolute(roundArg)
  ? roundArg
  : path.resolve(repoRoot, roundArg.replace(/^\.\//, ''))
const sh = path.join(roundDir, 'sync-lab.sh')

if (!fs.existsSync(sh)) {
  // eslint-disable-next-line no-console
  console.error(
    [
      `Missing ${sh}`,
      '',
      'Канон design-lab: bash sync-lab.sh в папке раунда.',
      'Пример: design-lab/capital-page/details-actions-round/sync-lab.sh',
    ].join('\n'),
  )
  process.exit(1)
}

function trySpawn(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false })
  return r.status === 0 ? 0 : r.status ?? 1
}

const bash = process.platform === 'win32' ? 'bash' : '/usr/bin/env bash'
const code = trySpawn(bash, [sh])
process.exit(code)
