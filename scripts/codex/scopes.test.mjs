import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ROOT } from './policy.mjs';
import { visibleSkills, skillsInScope, hasInlineHooks } from './skills.mjs';

const common = ['api-contract-change', 'architecture-decision', 'codex-config-audit', 'db-migration', 'delivery', 'review-change', 'verify-change'];
const gameOnly = ['balance-playtest', 'event-audit', 'event-authoring', 'frontend-implementation', 'game-economy', 'mqx-design'];
const names = rows => rows.map(row => row.name).sort();

test('GAME gets its six workflows; PLAN and repository root get only shared workflows', () => {
  assert.deepEqual(names(visibleSkills(ROOT)), common);
  assert.deepEqual(names(visibleSkills(ROOT, path.join(ROOT, 'plan'))), common);
  assert.deepEqual(names(visibleSkills(ROOT, path.join(ROOT, 'plan/api'))), common);
  assert.deepEqual(names(visibleSkills(ROOT, path.join(ROOT, 'game'))), [...common, ...gameOnly].sort());
  assert.deepEqual(names(visibleSkills(ROOT, path.join(ROOT, 'game/web'))), [...common, ...gameOnly].sort());
  assert.deepEqual(names(visibleSkills(ROOT, path.join(ROOT, 'shared'))), common);
});

test('discovery accepts additional local skills without a fixed total and excludes sibling scopes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-scopes-'));
  try {
    for (const dir of ['.agents/skills/shared-example', 'plan/.agents/skills/plan-example', 'game/.agents/skills/game-example']) fs.mkdirSync(path.join(root, dir), { recursive: true });
    assert.deepEqual(names(visibleSkills(root, path.join(root, 'plan/api'))), ['plan-example', 'shared-example']);
    assert.equal(skillsInScope(root, 'missing').length, 0);
    assert.throws(() => visibleSkills(root, path.dirname(root)), /outside/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('ordinary config and feature switches do not duplicate hooks, all hook table forms do', () => {
  for (const text of ['', '# [hooks]\n', 'model = "example"', '[features]\nhooks = true', 'notes = """\n[hooks]\n"""\n[features]\nhooks = true']) assert.equal(hasInlineHooks(text), false, text);
  for (const text of ['[hooks]', '[[hooks.SessionStart]]', '["hooks".PreToolUse]', "['hooks']", 'hooks = {}', 'hooks.SessionStart = []']) assert.equal(hasInlineHooks(text), true, text);
});

test('shared delivery and API workflows do not hard-code GAME implementation files', () => {
  for (const name of ['delivery', 'api-contract-change', 'db-migration', 'review-change', 'verify-change']) {
    const text = fs.readFileSync(path.join(ROOT, '.agents/skills', name, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(text, /\bgame\/(?:api|web|docs)\//, name);
    assert.match(text, /продукт/i, name);
  }
});
