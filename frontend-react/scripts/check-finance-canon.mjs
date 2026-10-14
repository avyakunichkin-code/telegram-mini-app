import fs from 'node:fs'
import path from 'node:path'

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'))
}

function normalizeNewlines(s) {
  return s.replaceAll('\r\n', '\n')
}

function assert(condition, message) {
  if (!condition) {
    // eslint-disable-next-line no-console
    console.error(message)
    process.exit(1)
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Manifest token → JSX anchor regex.
 * `Name` → `<Name` (word boundary); `Name(title="X")` → `<Name … title="X"` (props may wrap lines).
 */
function anchorFor(token) {
  const m = /^([A-Za-z][\w.]*)\((\w+)="([^"]*)"\)$/.exec(token)
  if (m) {
    const [, name, prop, value] = m
    return new RegExp(`<${escapeRegExp(name)}\\s+${prop}="${escapeRegExp(value)}"`)
  }
  assert(/^[A-Za-z][\w.]*$/.test(token), `Invalid manifest token: ${JSON.stringify(token)}`)
  return new RegExp(`<${escapeRegExp(token)}(?![\\w.])`)
}

function checkOrder({ repoRoot, manifestRel, fileRel, tokens, label }) {
  assert(
    Array.isArray(tokens) && tokens.length > 0,
    `Invalid manifest: ${label} must be a non-empty array.`,
  )
  const absPath = path.join(repoRoot, fileRel)
  assert(fs.existsSync(absPath), `Missing prod file: ${absPath}`)
  const code = normalizeNewlines(fs.readFileSync(absPath, 'utf8'))

  const positions = tokens.map((t) => ({ id: t, pos: code.search(anchorFor(t)) }))

  const missing = positions.filter((p) => p.pos < 0)
  assert(
    missing.length === 0,
    [
      'Finance canon check failed.',
      '',
      `В \`${fileRel}\` не найдены якоря из канона (${label}):`,
      ...missing.map((p) => `- ${p.id}`),
      '',
      `Manifest: ${manifestRel}`,
      'Если блок убран осознанно — обновляем manifest (и design-lab parity).',
    ].join('\n'),
  )

  let last = -1
  for (const item of positions) {
    assert(
      item.pos >= last,
      [
        'Finance canon check failed.',
        '',
        `Порядок якорных блоков в \`${fileRel}\` не совпадает с каноном (${label}).`,
        '',
        'Ожидаемый порядок:',
        ...tokens.map((t) => `- ${t}`),
        '',
        `Нарушение на: ${item.id}`,
        `Manifest: ${manifestRel}`,
        '',
        'Если порядок меняем осознанно — обновляем manifest (и design-lab parity).',
      ].join('\n'),
    )
    last = item.pos
  }
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const manifestPath = path.join(repoRoot, 'design-lab', 'finance', 'canon.manifest.json')
  assert(fs.existsSync(manifestPath), `Missing finance manifest: ${manifestPath}`)
  const manifestRel = path.relative(repoRoot, manifestPath).replaceAll('\\', '/')

  const manifest = readJson(manifestPath)
  const pageEntry = manifest?.page_parity?.prod_entry
  assert(typeof pageEntry === 'string' && pageEntry, 'Invalid manifest: page_parity.prod_entry is required.')

  checkOrder({
    repoRoot,
    manifestRel,
    fileRel: pageEntry,
    tokens: manifest?.page_order_prod_components,
    label: 'page_order_prod_components',
  })

  const details = manifest?.details_panel_order
  assert(
    details && typeof details.prod_entry === 'string' && details.prod_entry,
    'Invalid manifest: details_panel_order.prod_entry is required.',
  )
  checkOrder({
    repoRoot,
    manifestRel,
    fileRel: details.prod_entry,
    tokens: details.components,
    label: 'details_panel_order.components',
  })

  // eslint-disable-next-line no-console
  console.log('OK: finance canon (page + details anchors order matches manifest).')
}

main()
