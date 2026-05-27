import fs from 'node:fs'
import path from 'node:path'

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'))
}

function normalizeNewlines(s) {
  return s.replaceAll('\r\n', '\n')
}

function extractPositions(code, tokens) {
  const out = new Map()
  for (const t of tokens) {
    out.set(t, code.indexOf(`<${t}`))
  }
  return out
}

function assert(condition, message) {
  if (!condition) {
    // eslint-disable-next-line no-console
    console.error(message)
    process.exit(1)
  }
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const manifestPath = path.join(repoRoot, 'design-lab', 'dashboard', 'canon.manifest.json')
  const dashboardPath = path.join(repoRoot, 'frontend-react', 'src', 'components', 'DashboardPremium.jsx')

  assert(fs.existsSync(manifestPath), `Missing dashboard manifest: ${manifestPath}`)
  assert(fs.existsSync(dashboardPath), `Missing prod file: ${dashboardPath}`)

  const manifest = readJson(manifestPath)
  const expected = manifest?.page_order_prod_components

  assert(
    Array.isArray(expected) && expected.length > 0,
    'Invalid manifest: page_order_prod_components must be a non-empty array.',
  )

  const codeRaw = fs.readFileSync(dashboardPath, 'utf8')
  const code = normalizeNewlines(codeRaw)

  const positions = extractPositions(code, expected)

  const missing = expected.filter((t) => (positions.get(t) ?? -1) < 0)
  assert(
    missing.length === 0,
    [
      'Dashboard canon check failed.',
      '',
      'В `DashboardPremium.jsx` отсутствуют ожидаемые компоненты из канона:',
      ...missing.map((t) => `- ${t}`),
      '',
      `Manifest: ${path.relative(repoRoot, manifestPath).replaceAll('\\', '/')}`,
      `Prod file: ${path.relative(repoRoot, dashboardPath).replaceAll('\\', '/')}`,
    ].join('\n'),
  )

  let lastPos = -1
  const orderErrors = []
  for (const t of expected) {
    const pos = positions.get(t)
    if (pos < lastPos) {
      orderErrors.push(t)
    }
    lastPos = pos
  }

  assert(
    orderErrors.length === 0,
    [
      'Dashboard canon check failed.',
      '',
      'Порядок блоков в `DashboardPremium.jsx` не совпадает с каноном (manifest).',
      '',
      'Ожидаемый порядок (prod components):',
      ...expected.map((t) => `- ${t}`),
      '',
      `Manifest: ${path.relative(repoRoot, manifestPath).replaceAll('\\', '/')}`,
      `Prod file: ${path.relative(repoRoot, dashboardPath).replaceAll('\\', '/')}`,
      '',
      'Подсказка: канон задаёт порядок page-блоков; если меняем порядок в prod — обновляем manifest + APPROVED.md.',
    ].join('\n'),
  )

  // eslint-disable-next-line no-console
  console.log('OK: dashboard canon (page block order matches manifest).')
}

main()

