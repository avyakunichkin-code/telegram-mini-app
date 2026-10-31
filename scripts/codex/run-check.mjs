// Explicit argv runner: no shell evaluation, command or environment logging.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT } from './policy.mjs';

const args = process.argv.slice(2);
if (args.shift() !== '--' || !args.length) { console.error('Usage: node scripts/codex/run-check.mjs -- executable arg...'); process.exit(2); }
const dir = path.join(ROOT, '.codex-state/logs'); fs.mkdirSync(dir, { recursive: true });
const log = path.join(dir, `${Date.now()}-${process.pid}.log`);
const fd = fs.openSync(log, 'wx');
const child = spawn(args[0], args.slice(1), { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let tail = ''; let failed = false;
function capture(data) { fs.writeSync(fd, data); tail = (tail + data.toString('utf8')).slice(-6000); }
child.stdout.on('data', capture); child.stderr.on('data', capture);
child.on('error', () => { failed = true; });
child.on('close', (code, signal) => {
  fs.closeSync(fd);
  // Full local log is intentional; run only tests/builds with synthetic data, never credentials.
  process.stdout.write(tail);
  console.log(`\nFull log: ${log}\nExit: ${code ?? 1}${signal ? `; signal ${signal}` : ''}`);
  process.exitCode = failed ? 1 : code ?? 1;
});
