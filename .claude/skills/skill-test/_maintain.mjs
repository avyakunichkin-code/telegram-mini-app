#!/usr/bin/env node
/**
 * Maintenance CLI for skill-test scripts (Sprint F).
 * Usage: node _maintain.mjs <command>
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const COMMANDS = {
  'inject-quality': '_inject-quality-block.mjs',
  'patch-workflow': '_patch-workflow-block.mjs',
  'patch-last-context': '_patch-last-context.mjs',
  'sync-smoke-specs': '_sync-smoke-specs.mjs',
  'check-archived': '_archived-check.mjs',
};

const cmd = process.argv[2];

if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log(`Usage: node _maintain.mjs <${Object.keys(COMMANDS).join('|')}>`);
  console.log('\nCommands:');
  console.log('  inject-quality     — блок «Стандарт качества» во все product skills');
  console.log('  patch-workflow     — delivery-workflow в устаревших quality-блоках');
  console.log('  patch-last-context — last_context 2026-06-20 для tiered skills');
  console.log('  sync-smoke-specs   — dedup smoke specs → _shared/SMOKE_STUB.md');
  console.log('  check-archived     — disable-model-invocation + banner + catalog');
  process.exit(cmd ? 0 : 1);
}

const script = COMMANDS[cmd];
if (!script) {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

const r = spawnSync(process.execPath, [path.join(dir, script)], {
  stdio: 'inherit',
  cwd: path.resolve(dir, '../../..'),
});

process.exit(r.status ?? 1);
