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
const ps1 = path.join(roundDir, 'sync-lab.ps1')
const runnerSh = path.join(repoRoot, 'design-lab', '_shared', 'sync-lab-runner.sh')

if (!fs.existsSync(sh) && !fs.existsSync(ps1)) {
  // eslint-disable-next-line no-console
  console.error(`Missing ${sh} or ${ps1}`)
  process.exit(1)
}

function trySpawn(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false })
  return r.status === 0 ? 0 : r.status ?? 1
}

if (fs.existsSync(sh)) {
  const bash = process.platform === 'win32' ? 'bash' : '/usr/bin/env bash'
  const code = trySpawn(bash, [sh])
  process.exit(code)
}

const pwshArgs = ['-NoProfile', '-File', ps1]
if (trySpawn('pwsh', pwshArgs) === 0) process.exit(0)

const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1]
if (process.platform === 'win32') {
  if (trySpawn('powershell.exe', psArgs) === 0) process.exit(0)
  if (trySpawn('powershell', psArgs) === 0) process.exit(0)
}

if (fs.existsSync(runnerSh)) {
  const bash = process.platform === 'win32' ? 'bash' : '/usr/bin/env bash'
  const code = trySpawn(bash, [runnerSh, roundDir])
  process.exit(code)
}

// eslint-disable-next-line no-console
console.error('No bash/pwsh/powershell runner available.')
process.exit(127)
