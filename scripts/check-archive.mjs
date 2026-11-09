import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/archive/relocations.json'), 'utf8'));
const visible = new Set(execFileSync('rg', ['--files'], {cwd: root, encoding: 'utf8'})
  .trim().split(/\r?\n/).map(p => p.replaceAll('\\', '/')));
for (const [old, archived] of Object.entries(manifest.moves)) {
  for (const name of [old, archived]) {
    const absolute = path.resolve(root, name);
    assert(absolute.startsWith(root + path.sep), `Path escapes repository: ${name}`);
    assert(fs.statSync(absolute).isFile(), `Missing document: ${name}`);
    assert(!visible.has(name), `Historical document in default search: ${name}`);
  }
  const stub = fs.readFileSync(path.join(root, old), 'utf8');
  const link = /\[архив\]\(([^)]+)\)/.exec(stub);
  assert(link, `Missing compatibility link: ${old}`);
  assert.equal(path.resolve(root, path.dirname(old), link[1]), path.resolve(root, archived));
}
for (const name of visible) {
  assert(!name.startsWith('docs/archive/') && !name.startsWith('design/archive/'), `Archive leaked: ${name}`);
}
for (const name of ['AGENTS.md', 'CONVENTIONS.md', 'docs/game/agents/DESIGN_LAB_NAVIGATION.md',
  'docs/game/agents/DESIGN_IMPROVEMENTS_BACKLOG.md', 'docs/game/foundation/SPEC_PRODUCT.md']) {
  assert(visible.has(name), `Active source hidden: ${name}`);
}
console.log(`PASS: ${Object.keys(manifest.moves).length} relocations, compatibility links and default rg exclusions`);
