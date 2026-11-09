import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const {moves, source_sha256_before: hashes} = JSON.parse(read('docs/product-doc-relocations.json'));
// Git's ignore parser is available both locally and in CI; --no-index also
// checks tracked compatibility files, which normal gitignore handling skips.
const candidates = [...Object.keys(moves), ...Object.values(moves)];
const result = spawnSync('git', ['-c', 'core.excludesFile=.ignore', 'check-ignore', '--no-index', '--stdin'],
  {cwd: root, encoding: 'utf8', input: candidates.join('\n') + '\n'});
assert(result.status === 0 || result.status === 1, result.stderr || 'Cannot evaluate ignore rules');
const excluded = new Set(result.stdout.trim().split(/\r?\n/));
const visible = new Set(candidates.filter(file => !excluded.has(file)));
const ignored = new Set(JSON.parse(read('.obsidian/app.json')).userIgnoreFilters);
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
check(new Set(Object.values(moves)).size === Object.keys(moves).length, 'Duplicate canonical destination');
for (const [old, current] of Object.entries(moves)) {
  assert(current.startsWith('docs/game/'), `Incorrect owner: ${current}`);
  assert(/^[a-f0-9]{64}$/.test(hashes[old]), `Missing original fingerprint: ${old}`);
  check(visible.has(current), `Current document hidden: ${current}`);
  check(fs.existsSync(path.join(root, current)), `Missing relocated document: ${current}`);
  check(!visible.has(old) && ignored.has(old), `Compatibility path indexed: ${old}`);
  const stub = read(old);
  check(stub.length < 400 && stub.includes('status: relocated'), `Duplicate content: ${old}`);
  const link = /\[ТВОЙ ХОД\]\(([^)]+)\)/.exec(stub);
  check(link && path.resolve(root, path.dirname(old), link[1]) === path.join(root, current), `Wrong redirect: ${old}`);
}

function markdownFiles(dir) {
  return fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap(entry => {
    const file = `${dir}/${entry.name}`;
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}
const files = [...markdownFiles('docs/game'),
  'docs/README.md', 'docs/PROJECT_STRUCTURE.md', 'docs/DOCUMENTATION_SYSTEM.md',
  'docs/plan/README.md', 'docs/plan/AGENTS.md', 'docs/plan/DESIGN.md'];
for (const file of files) {
  for (const match of read(file).matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (!target || /^[a-z][\w+.-]*:/i.test(target)) continue;
    const absolute = path.resolve(root, path.dirname(file), target);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    check(fs.existsSync(absolute), `Missing link ${file}: ${target}`);
    check(!Object.hasOwn(moves, relative), `Use canonical path ${file}: ${target}`);
  }
}
if (failures.length) {
  for (const message of failures) console.error(`FAIL: ${message}`);
  process.exitCode = 1;
} else console.log(`PASS: ${Object.keys(moves).length} Game relocations, search exclusions and links in ${files.length} documents`);
