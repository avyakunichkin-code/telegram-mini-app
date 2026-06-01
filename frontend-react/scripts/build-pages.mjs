/**
 * Сборка для GitHub Pages: игра в dist/ (корень сайта), лендинг в dist/landing/.
 * Запуск: npm run build:pages (из frontend-react)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const landingRoot = join(frontendRoot, '..', 'landing');
const landingDist = join(landingRoot, 'dist');
const appDist = join(frontendRoot, 'dist');
const landingTarget = join(appDist, 'landing');

const PAGES_BASE = (process.env.VITE_BASE_PATH || '/telegram-mini-app/').replace(/\/?$/, '/');
const LANDING_BASE = `${PAGES_BASE}landing/`;

function runNpm(script, cwd, extraEnv = {}) {
  const result = spawnSync('npm', ['run', script], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(join(landingRoot, 'package.json'))) {
  console.error('Не найден каталог landing/ рядом с frontend-react');
  process.exit(1);
}

console.log(`→ landing (base ${LANDING_BASE})`);
runNpm('build', landingRoot, { BASE_PATH: LANDING_BASE });

console.log(`→ frontend-react (base ${PAGES_BASE})`);
runNpm('build', frontendRoot);

if (!existsSync(landingDist)) {
  console.error('Нет landing/dist — проверьте сборку лендинга');
  process.exit(1);
}

const landingHtml = readFileSync(join(landingDist, 'index.html'), 'utf8');
if (!landingHtml.includes(LANDING_BASE)) {
  console.error(
    `Сборка лендинга без BASE_PATH=${LANDING_BASE}. ` +
      'Не копируйте landing/dist вручную — используйте npm run build:pages.',
  );
  process.exit(1);
}

if (existsSync(landingTarget)) {
  rmSync(landingTarget, { recursive: true, force: true });
}
mkdirSync(landingTarget, { recursive: true });
cpSync(landingDist, landingTarget, { recursive: true });

console.log('✓ dist/landing/ готов');
console.log(`  Игра:    ${PAGES_BASE}`);
console.log(`  Лендинг: ${LANDING_BASE}`);
