import { execFileSync } from 'node:child_process'

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function isRelevantFile(path) {
  const p = path.replaceAll('\\', '/')
  if (!p.startsWith('frontend-react/src/')) return false
  if (p.startsWith('frontend-react/src/components/mqx/')) return true
  return (
    p.endsWith('.js') ||
    p.endsWith('.jsx') ||
    p.endsWith('.css')
  )
}

function parseUnified0Diff(diffText) {
  // Returns list of { file, addedLines: string[] }
  const out = []
  let current = null
  const lines = diffText.split(/\r?\n/)

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (current) out.push(current)
      current = { file: null, addedLines: [] }
      continue
    }

    if (!current) continue

    if (line.startsWith('+++ b/')) {
      current.file = line.slice('+++ b/'.length).trim()
      continue
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      current.addedLines.push(line.slice(1))
    }
  }

  if (current) out.push(current)
  return out.filter((x) => x.file && isRelevantFile(x.file) && x.addedLines.length)
}

function matchAddedViolations(file, addedLines) {
  const violations = []

  const isCss = file.endsWith('.css')
  const isJs = file.endsWith('.js') || file.endsWith('.jsx')

  for (const raw of addedLines) {
    const line = raw.trim()
    if (!line) continue

    if (isJs) {
      // Blocks new inline styles in JSX (prefer mqx classes / tokens).
      if (/\bstyle\s*=\s*\{\{/.test(line) || /\bstyle\s*=\s*["']/.test(line)) {
        violations.push({ kind: 'inline-style', line: raw })
        continue
      }
    }

    if (isCss) {
      // Only block new ad-hoc px in typography/spacing properties.
      // We allow CSS vars and calc() that resolve to vars; we block direct `12px` etc.
      const px = /\b(\d+(\.\d+)?)px\b/
      if (!px.test(line)) continue

      const isTypography =
        /\b(font-size|line-height|letter-spacing)\s*:/.test(line) &&
        !/var\(--/.test(line)
      const isSpacing =
        /\b(margin|padding|gap|row-gap|column-gap)\b/.test(line) &&
        !/var\(--/.test(line)

      if (isTypography) {
        violations.push({ kind: 'typography-px', line: raw })
        continue
      }

      if (isSpacing) {
        violations.push({ kind: 'spacing-px', line: raw })
        continue
      }
    }
  }

  return violations
}

function main() {
  // Only inspect *added lines* to avoid breaking existing tech debt.
  const diff = runGit(['diff', '--unified=0'])
  const files = parseUnified0Diff(diff)

  const errors = []
  for (const f of files) {
    const v = matchAddedViolations(f.file, f.addedLines)
    if (!v.length) continue
    for (const it of v) {
      errors.push({ file: f.file, kind: it.kind, line: it.line })
    }
  }

  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error(
      [
        'Style discipline check failed.',
        '',
        'Найдены новые (добавленные) ad-hoc стили. Цель: токены/классы вместо inline и случайных px.',
        '',
        'Исправить:',
        '- JSX: убрать inline `style={{...}}`, заменить на классы (предпочтительно MQX) или вынести в CSS.',
        '- CSS: typography/spacing в px заменить на var(--mqx-*) / токены проекта.',
        '',
        ...errors.map((e) => `- ${e.file} [${e.kind}]: ${e.line}`),
      ].join('\n'),
    )
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log('OK: style discipline (no new inline styles or ad-hoc px in added lines).')
}

main()

