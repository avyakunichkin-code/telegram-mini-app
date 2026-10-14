#!/usr/bin/env node
/**
 * Self-test блокирующих хуков (guard-generated.mjs, agent-memory-only.mjs):
 * гоняет хук через stdin как Claude Code и сверяет exit code.
 * Запуск из корня репо: node .claude/hooks/guards.test.mjs  (exit 1 при FAIL)
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const HOOKS_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOOK = path.join(HOOKS_DIR, 'guard-generated.mjs');
const MEMORY_HOOK = path.join(HOOKS_DIR, 'agent-memory-only.mjs');
const REPO = path.resolve(HOOKS_DIR, '..', '..');
const MEM = path.join(REPO, '.claude', 'agent-memory');
const ROOT = 'C:\\repo\\telegram-mini-app';
const BASELINE = `${ROOT}\\backend\\migrations\\0000_schema_baseline.sql`;

const cases = [
  ['Write design-lab/index.html', { tool_name: 'Write', tool_input: { file_path: `${ROOT}\\design-lab\\index.html`, content: '<html>' } }, 2],
  ['Edit round lab-base.css', { tool_name: 'Edit', tool_input: { file_path: `${ROOT}/design-lab/dashboard/goal-round/lab-base.css`, old_string: 'a', new_string: 'b' } }, 2],
  ['Edit nested _baseline lab-base.css', { tool_name: 'Edit', tool_input: { file_path: `${ROOT}/design-lab/_baseline/dashboard/blocks/goal/lab-base.css`, old_string: 'a', new_string: 'b' } }, 2],
  ['Edit round index.html (allowed)', { tool_name: 'Edit', tool_input: { file_path: `${ROOT}/design-lab/dashboard/goal-round/index.html`, old_string: 'a', new_string: 'b' } }, 0],
  ['Edit round styles.css (allowed)', { tool_name: 'Edit', tool_input: { file_path: `${ROOT}/design-lab/dashboard/goal-round/styles.css`, old_string: 'a', new_string: 'b' } }, 0],
  ['Edit baseline INSERT', { tool_name: 'Edit', tool_input: { file_path: BASELINE, old_string: 'x', new_string: "CREATE TABLE t (id int);\nINSERT INTO t VALUES (1);" } }, 2],
  ['Edit baseline lowercase update after ;', { tool_name: 'Edit', tool_input: { file_path: BASELINE, old_string: 'x', new_string: 'ALTER TABLE t ADD c int; update t set c = 0;' } }, 2],
  ['Write baseline DELETE', { tool_name: 'Write', tool_input: { file_path: BASELINE, content: 'CREATE TABLE t (id int);\n  DELETE FROM t;\n' } }, 2],
  ['MultiEdit baseline INSERT', { tool_name: 'MultiEdit', tool_input: { file_path: BASELINE, edits: [{ old_string: 'a', new_string: 'b' }, { old_string: 'c', new_string: 'INSERT INTO t VALUES (1);' }] } }, 2],
  ['Edit baseline DDL with ON DELETE CASCADE (allowed)', { tool_name: 'Edit', tool_input: { file_path: BASELINE, old_string: 'x', new_string: 'FOREIGN KEY(k) REFERENCES p (k) ON DELETE CASCADE ON UPDATE CASCADE' } }, 0],
  ['Edit baseline comment mentioning INSERT (allowed)', { tool_name: 'Edit', tool_input: { file_path: BASELINE, old_string: 'x', new_string: '-- INSERT INTO is forbidden here\nCREATE INDEX ix ON t (c);' } }, 0],
  ['Edit incremental migration with INSERT (allowed)', { tool_name: 'Edit', tool_input: { file_path: `${ROOT}/backend/migrations/0042_backfill.sql`, old_string: 'x', new_string: 'INSERT INTO t VALUES (1);' } }, 0],
  ['Unrelated file (allowed)', { tool_name: 'Write', tool_input: { file_path: `${ROOT}/backend/app/game/period.py`, content: 'x' } }, 0],
  ['Malformed stdin (allowed)', 'not json', 0],
];

// agent-memory-only.mjs economy-reviewer — запись только в .claude/agent-memory/economy-reviewer/
const memCases = [
  ['memory: Write own MEMORY.md (allowed)', { tool_name: 'Write', tool_input: { file_path: path.join(MEM, 'economy-reviewer', 'MEMORY.md'), content: 'x' } }, 0],
  ['memory: Edit relative path in memory dir (allowed)', { tool_name: 'Edit', cwd: REPO, tool_input: { file_path: '.claude/agent-memory/economy-reviewer/notes.md', old_string: 'a', new_string: 'b' } }, 0],
  ['memory: Edit backend source', { tool_name: 'Edit', tool_input: { file_path: path.join(REPO, 'backend', 'app', 'game', 'period.py'), old_string: 'a', new_string: 'b' } }, 2],
  ['memory: traversal out of memory dir', { tool_name: 'Write', tool_input: { file_path: path.join(MEM, 'economy-reviewer', '..', '..', 'settings.json'), content: '{}' } }, 2],
  ['memory: other agent memory dir', { tool_name: 'Write', tool_input: { file_path: path.join(MEM, 'mqx-ui-reviewer', 'MEMORY.md'), content: 'x' } }, 2],
  ['memory: sibling prefix dir', { tool_name: 'Write', tool_input: { file_path: path.join(MEM, 'economy-reviewer-evil', 'x.md'), content: 'x' } }, 2],
  ['memory: no file_path', { tool_name: 'Write', tool_input: {} }, 2],
];

const runs = [
  ...cases.map((c) => [HOOK, [], ...c]),
  ...memCases.map((c) => [MEMORY_HOOK, ['economy-reviewer'], ...c]),
];

let fails = 0;
for (const [hook, args, name, payload, expected] of runs) {
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const env = { ...process.env, CLAUDE_PROJECT_DIR: REPO };
  const res = spawnSync(process.execPath, [hook, ...args], { input, encoding: 'utf8', env });
  const ok = res.status === expected && (expected === 0 || res.stderr.trim().length > 0);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name} → exit ${res.status} (expected ${expected})${ok ? '' : `\n      stderr: ${res.stderr.trim()}`}`);
}
console.log(`\nSummary: ${runs.length - fails} OK, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
