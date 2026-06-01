import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guardrail: lab E2/E5 deltas stay in sync with prod events.css.
 * Mapping: design-lab/events/tails-round/APPROVED.md
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const labCss = readFileSync(join(root, 'design-lab/events/tails-round/styles.css'), 'utf8')
const prodCss = readFileSync(join(root, 'frontend-react/src/styles/mqx/events.css'), 'utf8')
const labHtml = readFileSync(join(root, 'design-lab/events/tails-round/index.html'), 'utf8')
const demoJs = readFileSync(
  join(root, 'frontend-react/src/components/mqx/catalog/catalogEventsTailsDemo.js'),
  'utf8',
)

/** @type {{ name: string, lab: RegExp, prod: RegExp }[]} */
const CSS_PAIRS = [
  {
    name: 'E5 title line-clamp',
    lab: /\.ev-l3-head \.ev-m2__title[\s\S]*-webkit-line-clamp:\s*2/,
    prod: /\.mqx-events-card__title--l3[\s\S]*-webkit-line-clamp:\s*2/,
  },
  {
    name: 'E5 bubble max-height 5.6em',
    lab: /\.ev-l3 \.ev-m2__bubble[\s\S]*max-height:\s*5\.6em/,
    prod: /\.mqx-events-card--l3 \.mqx-events-card__bubble[\s\S]*max-height:\s*5\.6em/,
  },
  {
    name: 'E5 choice title clamp',
    lab: /\.ev-choice--flat \.ev-choice__title[\s\S]*-webkit-line-clamp:\s*2/,
    prod: /\.mqx-events-choice__title[\s\S]*-webkit-line-clamp:\s*2/,
  },
  {
    name: 'E2 halo gradient',
    lab: /\.ev-l3--insurance[\s\S]*linear-gradient/,
    prod: /\.mqx-events-card--l3\.mqx-events-card--insurance[\s\S]*linear-gradient/,
  },
  {
    name: 'E2 blur orb 110px',
    lab: /\.ev-l3--insurance::before[\s\S]*width:\s*110px/,
    prod: /\.mqx-events-card--l3\.mqx-events-card--insurance::after[\s\S]*width:\s*110px/,
  },
  {
    name: 'E2 monetka 56px',
    lab: /\.ev-l3--insurance \.ev-m2__monetka-wrap \.ev-monetka[\s\S]*width:\s*56px/,
    prod: /\.mqx-events-card--insurance \.mqx-events-card__monetka[\s\S]*width:\s*56px/,
  },
  {
    name: 'E2 pulse reduced motion',
    lab: /@media \(prefers-reduced-motion: reduce\)[\s\S]*ev-badge-insurance--pulse/,
    prod: /@media \(prefers-reduced-motion: reduce\)[\s\S]*mqx-events-card__badge-pulse/,
  },
]

const DEMO_SNIPPETS = [
  'ДТП на перекрёстке с повреждением бампера и фары',
  'Кофе каждый день у офиса — привычка съедает бюджет',
  'Пока без абонемента — плачу по чашке каждый день',
]

function main() {
  const errors = []

  for (const { name, lab, prod } of CSS_PAIRS) {
    if (!lab.test(labCss)) errors.push(`lab CSS missing: ${name}`)
    if (!prod.test(prodCss)) errors.push(`prod CSS missing: ${name}`)
  }

  for (const snippet of DEMO_SNIPPETS) {
    if (!labHtml.includes(snippet)) errors.push(`lab index.html missing text: ${snippet.slice(0, 40)}…`)
    if (!demoJs.includes(snippet)) errors.push(`catalogEventsTailsDemo.js missing text: ${snippet.slice(0, 40)}…`)
  }

  if (errors.length > 0) {
    console.error(['Events tails parity check failed.', '', ...errors.map((e) => `- ${e}`), '', 'See design-lab/events/tails-round/APPROVED.md'].join('\n'))
    process.exit(1)
  }

  console.log('OK: events tails lab ↔ prod parity.')
}

main()
