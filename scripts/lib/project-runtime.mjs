import { existsSync } from 'node:fs';
import path from 'node:path';

const defaults = { game: { api: 8000, web: 5173 }, plan: { api: 8020, web: 5190 } };
export function projectPorts(product, env = process.env) {
  if (!defaults[product]) throw new Error('Unknown product');
  const port = (value, fallback) => {
    const number = value === undefined ? fallback : Number(value);
    if (!Number.isInteger(number) || number < 1024 || number > 65535) throw new Error('Project port must be 1024..65535');
    return number;
  };
  return { api: port(env.PROJECT_API_PORT, defaults[product].api), web: port(env.PROJECT_WEB_PORT, defaults[product].web) };
}

export function projectPython(root, product, explicit) {
  if (!defaults[product]) throw new Error('Unknown product');
  if (explicit) return explicit;
  const local = path.join(root, product, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (!existsSync(local)) throw new Error(`Missing ${product}/.venv: create the product environment and install its API requirements (or set PROJECT_PYTHON explicitly)`);
  return local;
}

export function apiCommand(root, product, { python, port, reload = true } = {}) {
  const args = ['-m', 'uvicorn', product === 'plan' ? 'plan_api.main:create_app' : 'main:app'];
  if (product === 'plan') args.push('--factory');
  if (reload) args.push('--reload');
  args.push('--host', '127.0.0.1', '--port', String(projectPorts(product, { PROJECT_API_PORT: port }).api));
  return { executable: projectPython(root, product, python), args, cwd: path.join(root, product, 'api') };
}
