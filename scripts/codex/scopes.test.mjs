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
  for (const scope of ['', 'plan', 'plan/api', 'game', 'game/web', 'shared']) {
    const actual = names(visibleSkills(ROOT, path.join(ROOT, scope)));
    for (const name of common) assert.ok(actual.includes(name), `${scope}: missing common ${name}`);
    for (const name of gameOnly) assert.equal(actual.includes(name), scope === 'game' || scope.startsWith('game/'), `${scope}: ${name}`);
  }
});

test('skill links cannot hide a workflow from ancestor discovery or load an unrelated source', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-skill-links-'));
  try {
    const target = path.join(root, 'game/.agents/skills/game-example');
    fs.mkdirSync(target, { recursive: true });
    const commonDir = path.join(root, '.agents/skills');
    fs.mkdirSync(commonDir, { recursive: true });
    fs.symlinkSync(target, path.join(commonDir, 'game-example'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.ok(names(visibleSkills(root, path.join(root, 'plan'))).includes('game-example'));
    const unrelated = path.join(root, 'unrelated');
    fs.mkdirSync(unrelated);
    fs.symlinkSync(unrelated, path.join(commonDir, 'unreviewed'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => visibleSkills(root), /requires review/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
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
  for (const text of ['[hooks]', '[[hooks.SessionStart]]', '["hooks".PreToolUse]', "['hooks']", 'hooks = {}', 'hooks.SessionStart = []', 'model = "example" # """\n[hooks]']) assert.equal(hasInlineHooks(text), true, text);
});

test('shared delivery and API workflows do not hard-code GAME implementation files', () => {
  for (const name of ['delivery', 'api-contract-change', 'db-migration', 'review-change', 'verify-change']) {
    const text = fs.readFileSync(path.join(ROOT, '.agents/skills', name, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(text, /\bgame\/(?:api|web|docs)\//, name);
    assert.match(text, /продукт/i, name);
  }
  for (const name of ['SPEC_FEATURE.md', 'PLAN_FEATURE.md', 'TASK_SLICE.md']) {
    const text = fs.readFileSync(path.join(ROOT, 'docs/templates', name), 'utf8');
    assert.doesNotMatch(text, /\bgame\/(?:api|web|docs)\//, name);
    assert.doesNotMatch(text, /incremental-implementation|frontend-ui-engineering|api-and-interface-design|critical-test-scenarios|frontend-react/, name);
  }
});

test('moving a skill into a product does not activate unrelated product CI suites', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  const expression = /grep -Ev '([^']+)'/.exec(workflow)?.[1];
  assert.ok(expression, 'Missing metadata exclusion in the actual CI routing');
  const excluded = new RegExp(expression);
  for (const file of ['.agents/skills/delivery/SKILL.md', 'game/.agents/skills/game-economy/SKILL.md', 'plan/.agents/skills/example/reference.json', 'game/AGENTS.md', 'plan/api/AGENTS.override.md', 'game/docs/engineering/CODEX-PROCESSES.md', 'plan/docs/engineering/CODEX-PROCESSES.md', 'scripts/codex/skills.mjs', 'game/.codex/config.toml']) assert.equal(excluded.test(file), true, file);
  for (const file of ['game/api/app/game/period.py', 'plan/web/src/App.jsx', 'shared/packages/fincore/src/fincore/month.py', 'game/data/events/mvp11/catalog.yaml', '.github/workflows/ci.yml']) assert.equal(excluded.test(file), false, file);
});
