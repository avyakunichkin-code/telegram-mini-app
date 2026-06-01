import { execFileSync } from 'node:child_process'

/**
 * Legacy quarantine guard:
 * Prevent creating NEW files under src/components/ (legacy),
 * except for explicitly allowed zones.
 *
 * We detect newly added files via `git status --porcelain`:
 * - "??" untracked
 * - "A " / "AM" / etc staged additions
 *
 * This keeps the rule enforceable without relying on human discipline.
 */

const ALLOWED_PREFIXES = [
  // MQX is the only allowed place for new visible UI patterns
  'frontend-react/src/components/mqx/',
  // Admin screens are isolated and may evolve independently
  'frontend-react/src/components/admin/',
  // This README is part of the quarantine itself
  'frontend-react/src/components/README.md',
]

function isInAllowedZone(p) {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix))
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function parsePorcelainLine(line) {
  // Format examples:
  // "?? path"
  // "A  path"
  // "AM path"
  // "R  old -> new"
  const trimmed = line.trimEnd()
  if (!trimmed) return null

  if (trimmed.startsWith('?? ')) {
    return { kind: 'untracked', path: trimmed.slice(3) }
  }

  const xy = trimmed.slice(0, 2)
  const rest = trimmed.slice(3)

  if (xy.includes('R')) {
    const parts = rest.split(' -> ')
    const newPath = parts.length === 2 ? parts[1] : null
    return newPath ? { kind: 'rename', path: newPath } : null
  }

  if (xy.includes('A')) {
    return { kind: 'added', path: rest }
  }

  return null
}

function main() {
  const out = runGit(['status', '--porcelain'])
  const lines = out.split(/\r?\n/)

  const violations = []
  for (const line of lines) {
    const entry = parsePorcelainLine(line)
    if (!entry) continue

    const p = entry.path.replaceAll('\\', '/')
    if (!p.startsWith('frontend-react/src/components/')) continue

    if (!isInAllowedZone(p)) {
      violations.push(`${entry.kind}: ${p}`)
    }
  }

  if (violations.length) {
    // eslint-disable-next-line no-console
    console.error(
      [
        'Components quarantine check failed.',
        'Нельзя добавлять новые файлы в `frontend-react/src/components/` (legacy).',
        'Разрешено: `components/mqx/**`, `components/admin/**` и `components/README.md`.',
        '',
        'Найдено:',
        ...violations.map((v) => `- ${v}`),
      ].join('\n'),
    )
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log('OK: components quarantine (no new legacy files).')
}

main()

