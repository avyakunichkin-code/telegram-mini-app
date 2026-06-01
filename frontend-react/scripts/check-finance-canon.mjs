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

function indexOfOrFail(code, needle, label) {
  const idx = code.indexOf(needle)
  assert(
    idx >= 0,
    [
      'Finance canon check failed.',
      '',
      `Не найден якорь: ${label}`,
      `Ищем строку: ${JSON.stringify(needle)}`,
    ].join('\n'),
  )
  return idx
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const manifestPath = path.join(repoRoot, 'design-lab', 'finance', 'canon.manifest.json')
  const prodPath = path.join(repoRoot, 'frontend-react', 'src', 'components', 'FinancePremium.jsx')

  assert(fs.existsSync(manifestPath), `Missing finance manifest: ${manifestPath}`)
  assert(fs.existsSync(prodPath), `Missing prod file: ${prodPath}`)

  const manifest = readJson(manifestPath)
  const expected = manifest?.page_order_prod_components
  assert(
    Array.isArray(expected) && expected.length > 0,
    'Invalid manifest: page_order_prod_components must be a non-empty array.',
  )

  const code = normalizeNewlines(fs.readFileSync(prodPath, 'utf8'))

  const anchors = [
    { id: 'MqxTabHero', needle: '<MqxTabHero' },
    { id: 'CapitalMonetkaGuidance', needle: '<CapitalMonetkaGuidance' },
    { id: 'CapitalPeriodFlowsBlock', needle: '<CapitalPeriodFlowsBlock' },
  ]

  const accordionTitles = ['Инвестиции', 'Страховки', 'Имущество', 'Обязательства']
  for (const t of accordionTitles) {
    anchors.push({
      id: `MqxCapitalSectionAccordion(title="${t}")`,
      needle: `<MqxCapitalSectionAccordion title="${t}"`,
    })
  }

  // Ensure all anchors exist and are in increasing order
  let last = -1
  const order = []
  for (const a of anchors) {
    const pos = indexOfOrFail(code, a.needle, a.id)
    order.push({ id: a.id, pos })
  }

  for (const item of order) {
    assert(
      item.pos >= last,
      [
        'Finance canon check failed.',
        '',
        'Порядок якорных блоков в `FinancePremium.jsx` не совпадает с каноном.',
        '',
        'Ожидаемый порядок:',
        ...anchors.map((a) => `- ${a.id}`),
        '',
        `Нарушение на: ${item.id}`,
        `Manifest: ${path.relative(repoRoot, manifestPath).replaceAll('\\', '/')}`,
        `Prod file: ${path.relative(repoRoot, prodPath).replaceAll('\\', '/')}`,
        '',
        'Если порядок меняем осознанно — обновляем manifest (и design-lab parity).',
      ].join('\n'),
    )
    last = item.pos
  }

  // eslint-disable-next-line no-console
  console.log('OK: finance canon (anchors order matches manifest).')
}

main()

