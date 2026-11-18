/**
 * Храповик стилевого долга styles/mqx: цветовые литералы и шрифты < 12 px могут только убывать.
 * Базовые счётчики — scripts/mqx-style-ratchet.json (в репозитории).
 *
 *   node scripts/check-mqx-ratchet.mjs           # проверка (guardrails)
 *   node scripts/check-mqx-ratchet.mjs --update  # зафиксировать новый, меньший уровень
 *
 * Аудит 2026-10-25, улучшение 7. Подъём шрифтов и сокращение палитры — через design-lab.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countDebt } from './mqx-style-debt.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const mqxDir = path.resolve(here, '../src/styles/mqx');
const baselineFile = path.join(here, 'mqx-style-ratchet.json');

const current = {};
for (const name of fs.readdirSync(mqxDir).filter((n) => n.endsWith('.css')).sort()) {
  current[name] = countDebt(fs.readFileSync(path.join(mqxDir, name), 'utf8'));
}

const totals = (counts) =>
  Object.values(counts).reduce(
    (acc, c) => ({ colors: acc.colors + c.colors, fontUnder12: acc.fontUnder12 + c.fontUnder12 }),
    { colors: 0, fontUnder12: 0 },
  );

if (process.argv.includes('--update')) {
  const payload = {
    note: 'Храповик check-mqx-ratchet: счётчики могут только убывать. Обновлять --update после уменьшения долга.',
    files: current,
    totals: totals(current),
  };
  fs.writeFileSync(baselineFile, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), baselineFile)}:`, JSON.stringify(payload.totals));
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8')).files;
const errors = [];
const improved = [];
for (const [name, c] of Object.entries(current)) {
  const b = baseline[name] || { colors: 0, fontUnder12: 0 };
  for (const key of ['colors', 'fontUnder12']) {
    if (c[key] > b[key]) errors.push(`- ${name}: ${key} ${b[key]} → ${c[key]}`);
    else if (c[key] < b[key]) improved.push(`${name}: ${key} ${b[key]} → ${c[key]}`);
  }
}

if (errors.length) {
  console.error(
    [
      'MQX style ratchet failed: стилевой долг в styles/mqx вырос.',
      '',
      'Цвета — через токены --mq-* (tokens.css), шрифты — не меньше --mq-fs-caption (12 px).',
      'Запасные цвета var(--tg-theme-*, #…) не считаются.',
      '',
      ...errors,
    ].join('\n'),
  );
  process.exit(1);
}

const t = totals(current);
console.log(`OK: mqx style ratchet (colors ${t.colors}, font<12 ${t.fontUnder12}; не выросло).`);
if (improved.length) {
  console.log(`  Долг уменьшился — зафиксируй: node scripts/check-mqx-ratchet.mjs --update\n  ${improved.join('\n  ')}`);
}
