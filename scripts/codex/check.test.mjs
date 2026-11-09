import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { ROOT, BASELINE, ddlOnly } from './policy.mjs';

// Simulate catalog evolution without writing into the live skill/config folders.
const source = fs.readFileSync(path.join(ROOT, 'scripts/codex/check.mjs'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '');
function run({ extraSkill = false, staleTarget = false, config = false, args = [] } = {}) {
  const messages = [];
  const fakeFs = {
    ...fs,
    readdirSync(p, options) {
      const entries = fs.readdirSync(p, options);
      if (extraSkill && p === path.join(ROOT, '.agents/skills')) {
        entries.push({ name: 'new-skill', isDirectory: () => true });
      }
      return entries;
    },
    readFileSync(p, encoding) {
      if (p === path.join(ROOT, '.agents/skills/new-skill/SKILL.md')) {
        return '---\nname: new-skill\ndescription: A valid additional project skill for catalog evolution.\n---\n';
      }
      if (staleTarget && p === path.join(ROOT, 'docs/ai/skill-migration.json')) {
        const rows = JSON.parse(fs.readFileSync(p, encoding));
        rows[0].new_location = '.agents/skills/retired-skill/SKILL.md';
        return JSON.stringify(rows);
      }
      return fs.readFileSync(p, encoding);
    },
    existsSync(p) {
      if (config && p === path.join(ROOT, '.codex/config.toml')) return true;
      return fs.existsSync(p);
    },
  };
  const process = { argv: ['node', 'check.mjs', ...args], exitCode: 0 };
  vm.runInNewContext(source, {
    fs: fakeFs, path, crypto, ROOT, BASELINE, ddlOnly, process,
    console: { log: x => messages.push(x), error: x => messages.push(x) },
  });
  return { code: process.exitCode, messages };
}

test('Codex catalog can grow beyond the original 13 skills', () => {
  const result = run({ extraSkill: true });
  assert.equal(result.code, 0, result.messages.join('\n'));
  assert.ok(result.messages.some(x => x.includes('14 skills')));
});

test('historical mappings do not freeze current skill locations', () => {
  assert.equal(run({ staleTarget: true }).code, 0);
  const historical = run({ staleTarget: true, args: ['--source-drift'] });
  assert.equal(historical.code, 1);
  assert.ok(historical.messages.some(x => x.includes('Missing migration target')));
});

test('a project config file is not itself a configuration error', () => {
  const result = run({ config: true });
  assert.equal(result.code, 0, result.messages.join('\n'));
});
