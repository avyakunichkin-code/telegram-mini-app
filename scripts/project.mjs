import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [product, action] = process.argv.slice(2);
if (!['game', 'plan'].includes(product) || !['dev', 'api', 'build', 'check', 'e2e'].includes(action)) {
  console.error('Usage: node scripts/project.mjs <game|plan> <dev|api|build|check|e2e>');
  process.exit(2);
}
const home = path.join(root, product);
const python = process.env.PROJECT_PYTHON || [
  path.join(home, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
  path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
].find(existsSync) || (process.platform === 'win32' ? 'python' : 'python3');
function run(command, args, cwd, shell = false) {
  console.log(`\n${product}/${path.relative(home, cwd)}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const npm = (script, app = 'web') => run('npm', ['run', script], path.join(home, app), process.platform === 'win32');
if (action === 'dev') npm('dev');
if (action === 'api') run(python, ['-m', 'uvicorn', product === 'game' ? 'main:app' : 'plan_api.main:app', '--reload', '--port', product === 'game' ? '8000' : '8020'], path.join(home, 'api'));
if (action === 'e2e') npm('test:e2e');
if (action === 'check') {
  run(python, ['-m', 'pytest', '-q'], path.join(home, 'api'));
  npm('test:unit');
}
if (['build', 'check'].includes(action)) {
  npm('build');
  npm('build', 'landing');
  if (action === 'check' && product === 'game') npm('check:guardrails');
}
