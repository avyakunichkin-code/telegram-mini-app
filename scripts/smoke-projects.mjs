import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import net from 'node:net';
import { apiCommand } from './lib/project-runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const products = ['game', 'plan'];
if (process.argv[2] === '--web') {
  const product = process.argv[3];
  if (!products.includes(product)) throw new Error('Unknown product');
  const web = path.join(root, product, 'web');
  const require = createRequire(path.join(web, 'package.json'));
  const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
  const server = await createServer({ root: web, cacheDir: path.join(process.env.PROJECT_ENV_DIR, 'vite-cache'), server: { host: '127.0.0.1', port: Number(process.env.PROJECT_WEB_PORT), strictPort: true } });
  await server.listen();
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, async () => { await server.close(); process.exit(0); });
} else {
  const selected = process.argv.slice(2);
  if (selected.some(p => !products.includes(p))) throw new Error('Usage: node scripts/smoke-projects.mjs [game] [plan]');
  const scopes = selected.length ? [...new Set(selected)] : products;
  const temp = await mkdtemp(path.join(os.tmpdir(), 'product-smoke-'));
  const children = [];
  const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['path', 'systemroot', 'windir', 'temp', 'tmp', 'comspec', 'pathext', 'systemdrive'].includes(key.toLowerCase())));
  const launch = (executable, args, cwd, env) => {
    const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', chunk => { log = (log + chunk).slice(-6000); });
    child.stderr.on('data', chunk => { log = (log + chunk).slice(-6000); });
    child.on('error', error => { log += error.message; });
    const record = { child, log: () => log };
    children.push(record);
    return record;
  };
  const stop = async ({ child }) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await exited;
  };
  const ready = async (url, record, json = false) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (record.child.exitCode !== null) throw new Error(record.log());
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (response.ok) {
          if (json) { const body = await response.json(); assert.equal(body.status, 'ok'); assert.equal(body.database, 'connected'); }
          else assert.match(await response.text(), /<div id="root"><\/div>/);
          return;
        }
      } catch { /* allow startup to finish */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`Not ready: ${url}\n${record.log()}`);
  };
  const running = [];
  try {
    // Fail before launching anything when another session owns a smoke port.
    for (const product of scopes) {
      for (const port of product === 'game' ? [18000, 15173] : [18020, 15190]) {
        await new Promise((resolve, reject) => {
          const probe = net.createServer();
          probe.once('error', reject);
          probe.listen(port, '127.0.0.1', () => probe.close(resolve));
        });
      }
    }
    for (const product of scopes) {
      const api = product === 'game' ? 18000 : 18020;
      const web = product === 'game' ? 15173 : 15190;
      const home = path.join(temp, product);
      await mkdir(home);
      const env = { ...cleanEnv, PYTHON_DOTENV_DISABLED: '1', PYTHONIOENCODING: 'utf-8', PROJECT_ENV_DIR: home,
        SECRET_KEY: 'synthetic-smoke-secret-at-least-32-characters', ENVIRONMENT: 'development',
        DATABASE_URL: `sqlite:///${path.join(home, 'game.sqlite').replaceAll('\\', '/')}`,
        PLAN_ENV: 'dev', PLAN_SECRET_KEY: 'synthetic-smoke-secret-at-least-32-characters',
        PLAN_DATABASE_URL: `sqlite:///${path.join(home, 'plan.sqlite').replaceAll('\\', '/')}`,
        PROJECT_WEB_PORT: String(web), VITE_BASE_PATH: '/', VITE_API_BASE_URL: `http://127.0.0.1:${api}`, PLAN_API_URL: `http://127.0.0.1:${api}` };
      const command = apiCommand(root, product, { port: api, reload: false });
      const backend = launch(command.executable, command.args, command.cwd, env);
      await ready(`http://127.0.0.1:${api}/api/health`, backend, true);
      const frontend = launch(process.execPath, [fileURLToPath(import.meta.url), '--web', product], root, env);
      await ready(`http://127.0.0.1:${web}/`, frontend);
      await ready(`http://127.0.0.1:${web}/api/health`, frontend, true);
      running.push({ product, api, web, backend, frontend });
      console.log(`${product}: API, frontend HTML and API proxy PASS (${api}/${web})`);
    }
    if (running.length === 2) {
      await stop(running[0].frontend); await stop(running[0].backend);
      await ready(`http://127.0.0.1:${running[1].web}/api/health`, running[1].frontend, true);
      console.log('PLAN remains healthy after GAME stops: PASS');
    }
  } finally {
    await Promise.all(children.map(stop));
    if (path.dirname(temp) !== os.tmpdir() || !path.basename(temp).startsWith('product-smoke-')) throw new Error('Unsafe temporary path');
    await rm(temp, { recursive: true, force: true });
  }
}
