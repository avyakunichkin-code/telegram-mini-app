import net from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const servers = [net.createServer(), net.createServer()];
const ports = await Promise.all(servers.map(server => new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port));
})));
await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
const python = process.env.E2E_PYTHON || path.resolve(frontend, '../.venv/Scripts/python.exe');
const selected = process.argv.slice(2);
const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...(selected.length ? selected : ['e2e/pocket-board.spec.js', 'e2e/onboarding.spec.js', 'e2e/keyboard.spec.js'])], {
  cwd: frontend, stdio: 'inherit', windowsHide: true,
  env: { ...process.env, E2E_PYTHON: python, E2E_API_PORT: String(ports[0]), E2E_WEB_PORT: String(ports[1]) },
});
child.once('error', error => { console.error(error); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
