import { execFileSync } from 'node:child_process'

/**
 * Canon Sync guardrail.
 *
 * If we change MQX / dashboard UI, we must update design-lab canon docs
 * (APPROVED/README/page-round), otherwise design-lab drifts from prod.
 *
 * This check is conditional: it only fails when UI changes are detected.
 */

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function parsePorcelain(line) {
  const trimmed = line.trimEnd()
  if (!trimmed) return null
  if (trimmed.startsWith('?? ')) return { xy: '??', path: trimmed.slice(3) }
  const xy = trimmed.slice(0, 2)
  const rest = trimmed.slice(3)
  if (xy.includes('R')) {
    const parts = rest.split(' -> ')
    return { xy, path: parts.length === 2 ? parts[1] : rest }
  }
  return { xy, path: rest }
}

function isUiTouch(p) {
  const path = p.replaceAll('\\', '/')
  return (
    path.startsWith('frontend-react/src/components/mqx/') ||
    path === 'frontend-react/src/components/DashboardPremium.jsx' ||
    path === 'frontend-react/src/components/FinancePremium.jsx' ||
    path.startsWith('frontend-react/src/styles/') ||
    path === 'frontend-react/src/App.jsx'
  )
}

function isCanonTouch(p) {
  const path = p.replaceAll('\\', '/')
  if (!path.startsWith('design-lab/')) return false
  // Canon docs or parity pages
  if (path.endsWith('APPROVED.md') || path.endsWith('README.md')) return true
  if (path.includes('page-round/')) return true
  // Any new/updated round with index.html is acceptable as a canon-sync artifact
  if (path.endsWith('/index.html')) return true
  return false
}

function main() {
  const out = runGit(['status', '--porcelain'])
  const entries = out
    .split(/\r?\n/)
    .map(parsePorcelain)
    .filter(Boolean)
    .map((e) => ({ ...e, path: e.path.replaceAll('\\', '/') }))

  const uiChanges = entries.filter((e) => isUiTouch(e.path))
  if (uiChanges.length === 0) {
    // eslint-disable-next-line no-console
    console.log('OK: canon sync (no MQX/dashboard UI changes detected).')
    return
  }

  const canonChanges = entries.filter((e) => isCanonTouch(e.path))
  if (canonChanges.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      [
        'Canon sync check failed.',
        '',
        'Обнаружены изменения в MQX/дашборд UI, но нет обновлений канона в design-lab.',
        'Добавь минимум одно из:',
        '- обновление `design-lab/**/APPROVED.md` или `design-lab/**/README.md`',
        '- или round/page-round в design-lab с `index.html` (страница/паритет)',
        '',
        'UI изменения:',
        ...uiChanges.map((e) => `- ${e.xy} ${e.path}`),
      ].join('\n'),
    )
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log('OK: canon sync (UI change + design-lab canon updated).')
}

main()

