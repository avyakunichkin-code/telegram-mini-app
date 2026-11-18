import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPython, projectPorts, apiCommand } from './lib/project-runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [product, action] = process.argv.slice(2);
if (!['game', 'plan'].includes(product) || !['dev', 'api', 'build', 'check', 'e2e'].includes(action)) {
  console.error('Usage: node scripts/project.mjs <game|plan> <dev|api|build|check|e2e>');
  process.exit(2);
}
const home = path.join(root, product);
const ports = projectPorts(product);
function run(command, args, cwd, shell = false) {
  console.log(`\n${product}/${path.relative(home, cwd)}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const npm = (script, app = 'web', args = []) => run('npm', ['run', script, ...args], path.join(home, app), process.platform === 'win32');
if (action === 'dev') npm('dev', 'web', ['--', '--host', '127.0.0.1', '--port', String(ports.web), '--strictPort']);
if (action === 'api') {
  const command = apiCommand(root, product, { python: process.env.PROJECT_PYTHON, port: ports.api });
  run(command.executable, command.args, command.cwd);
}
if (action === 'e2e') npm('test:e2e');
if (action === 'check') {
  run(projectPython(root, product, process.env.PROJECT_PYTHON), ['-m', 'pytest', '-q'], path.join(home, 'api'));
  npm('test:unit');
}
if (['build', 'check'].includes(action)) {
  npm('build');
  npm('build', 'landing');
  if (action === 'check' && product === 'game') npm('check:guardrails');
}
