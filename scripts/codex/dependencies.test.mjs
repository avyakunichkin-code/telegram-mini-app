import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { legacyDependencies } from './dependencies.mjs';
import { ROOT } from './policy.mjs';
import fs from 'node:fs';
import path from 'node:path';

test('AI workflows run for every Markdown document in the checker scope', () => {
  for (const name of ['skills-check.yml', 'codex-check.yml']) {
    const text = fs.readFileSync(path.join(ROOT, '.github/workflows', name), 'utf8');
    const triggers = text.split(/\r?\n  (?=pull_request:|push:)/).slice(1);
    assert.ok(triggers.length, name);
    for (const trigger of triggers) assert.match(trigger, /- '\*\*\/\*\.md'/, name);
  }
});

test('source detection handles encoded paths and Windows document locations', () => {
  assert.ok(legacyDependencies('[old](../%2Eretired-agent/rules.md)', 'docs/guide.md').length);
  assert.ok(legacyDependencies('Read ../RETIRED_AGENT.md', 'docs/guide.md').length);
  assert.deepEqual(legacyDependencies('[current](CODEX-PROCESSES.md)', 'docs\\engineering\\CODEX-ARCHITECTURE.md'), []);
  assert.deepEqual(legacyDependencies('[guide](APPROVED.md)', 'game/design-lab/topic/README.md'), []);
});

test('legacy provenance is inert, but links and executable source readers are rejected', () => {
  assert.deepEqual(legacyDependencies('Historical source: `.retired-agent/skills/x/SKILL.md`.'), []);
  for (const text of ['[old](../../.retired-agent/skills/x.md)', '[old](..\\.retired-agent\\x.md)', '[old](RETIRED_AGENT.md)', '[[RETIRED_AGENT.md|index]]', 'node .retired-agent/check.mjs']) {
    assert.ok(legacyDependencies(text).length, text);
  }
  assert.deepEqual(legacyDependencies('[current](../../.agents/skills/delivery/SKILL.md)'), []);
});

test('plain reading instructions and Markdown reference links cannot restore legacy dependencies', () => {
  for (const text of ['Прочитай .retired-agent/rules/backend.md', 'Read `.retired-agent/rules/backend.md`', 'Get-Content .retired-agent/settings.json', '[old]: ../../.retired-agent/rules/backend.md', '[old]: <../RETIRED_AGENT.md>']) {
    assert.ok(legacyDependencies(text).length, text);
  }
  assert.ok(legacyDependencies('Не читай .retired-agent/rules/backend.md').length);
  assert.deepEqual(legacyDependencies('Historical source: `.retired-agent/rules/backend.md`.'), []);
});

for (const args of [[], ['--protected']]) test(`checker works with all legacy filesystem access denied ${args.join(' ')}`, () => {
  const preload = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    const legacy = value => String(value).replaceAll(String.fromCharCode(92), '/').toLowerCase().split('/').some(part => part === '.retired-agent' || part === 'retired_agent.md');
    for (const name of ['readFileSync','readdirSync','statSync','lstatSync','existsSync','openSync']) {
      const original = fs[name];
      fs[name] = function (target, ...rest) {
        if (legacy(target)) throw Error('Forbidden historical filesystem access: ' + target);
        return original.call(this, target, ...rest);
      };
    }
    syncBuiltinESMExports();
    let blocked = false;
    try { fs.existsSync('/.retired-agent/sentinel'); } catch { blocked = true; }
    if (!blocked) throw Error('Test guard did not activate');
  `;
  const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(preload)}`, 'scripts/codex/check.mjs', ...args], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PASS:/);
});
