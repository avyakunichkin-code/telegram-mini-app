// Hosting composition only: web and landing have independent build commands.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.env.VITE_BASE_PATH || '/telegram-mini-app/').replace(/\/?$/, '/');
for (const [app, extra] of [['web', {}], ['landing', { BASE_PATH: `${base}landing/` }]]) {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: path.join(game, app), stdio: 'inherit', shell: process.platform === 'win32',
    env: { ...process.env, ...extra },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const out = path.join(game, 'dist', 'pages');
if (path.relative(game, out) !== path.join('dist', 'pages')) throw new Error('Invalid output directory');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(path.join(game, 'web/dist'), out, { recursive: true });
cpSync(path.join(game, 'landing/dist'), path.join(out, 'landing'), { recursive: true });
console.log(`Pages artifact: ${out}`);
