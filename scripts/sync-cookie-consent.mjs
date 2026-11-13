// Раздаёт shared/packages/cookie-consent/cookie-consent.js по всем сайтам. `--check` — только проверка (для CI).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'shared/packages/cookie-consent/cookie-consent.js');
const targets = [
  'game/landing/site/cookie-consent.js',
  'plan/landing/site/cookie-consent.js',
  'plan/web/public/cookie-consent.js',
  'game/web/public/cookie-consent.js',
];
const check = process.argv.includes('--check');
const want = fs.readFileSync(src);
let bad = 0;
for (const t of targets) {
  const file = path.join(root, t);
  const have = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (have && have.equals(want)) continue;
  if (check) { console.error(`out of sync: ${t}`); bad++; continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, want);
  console.log(`synced ${t}`);
}
process.exit(bad ? 1 : 0);
