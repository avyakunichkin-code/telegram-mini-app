#!/usr/bin/env node
/**
 * Validate _archived/ skills: disable-model-invocation + banner + catalog status.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archivedRoot = path.join(root, '_archived');
const catalogPath = path.join(root, 'catalog.yaml');

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseCatalog(text) {
  const mSkills = text.match(/(?:^|\r?\n)skills:\r?\n([\s\S]*?)(?:\r?\nagents:|\s*$)/);
  const skillsBlock = mSkills ? mSkills[1] : '';
  const names = [...skillsBlock.matchAll(/^\s{2}([\w-]+):\s*$/gm)].map((x) => x[1]);

  function scalar(name, key) {
    const parts = skillsBlock.split(new RegExp(`^\\s{2}${name}:\\r?\\n`, 'm'));
    if (parts.length < 2) return null;
    const block = parts[1].split(/^\s{2}[\w-]+:\s*$/m)[0];
    const line = block.match(new RegExp(`^\\s{4}${key}:\\s*(.+)$`, 'm'));
    return line ? line[1].trim().replace(/^["']|["']$/g, '') : null;
  }

  return { names, scalar };
}

const catalog = parseCatalog(stripBom(fs.readFileSync(catalogPath, 'utf8')));
const dirs = fs.readdirSync(archivedRoot).filter((d) => {
  const p = path.join(archivedRoot, d);
  return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'SKILL.md'));
});

/** @type {string[]} */
const fails = [];
/** @type {string[]} */
const warns = [];

for (const name of dirs) {
  const skillPath = path.join(archivedRoot, name, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!fm || !/^disable-model-invocation:\s*true/m.test(fm[1])) {
    fails.push(`${name}: missing disable-model-invocation: true`);
  }
  if (!/АРХИВ \(ТВОЙ ХОД\)/.test(content)) {
    fails.push(`${name}: missing archive banner`);
  }
  const status = catalog.scalar(name, 'status');
  if (status !== 'archived') {
    warns.push(`${name}: catalog status is "${status ?? 'missing'}", expected archived`);
  }
}

for (const name of catalog.names) {
  if (catalog.scalar(name, 'status') !== 'archived') continue;
  if (!dirs.includes(name)) {
    warns.push(`catalog archived skill missing folder: ${name}`);
  }
}

console.log(`=== Archived Skills Check: ${dirs.length} folders ===\n`);
for (const name of dirs.sort()) {
  const ok = !fails.some((f) => f.startsWith(`${name}:`));
  console.log(`${name.padEnd(24)} ${ok ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
}
console.log('');
console.log(
  `Summary: ${dirs.length - fails.filter((f) => !f.includes('catalog')).length} COMPLIANT, ${warns.length} WARNINGS, ${new Set(fails.map((f) => f.split(':')[0])).size} NON-COMPLIANT`,
);

if (warns.length) {
  console.log('\n--- WARNINGS ---');
  for (const w of warns) console.log(`  WARN: ${w}`);
}
if (fails.length) {
  console.log('\n--- FAILURES ---');
  for (const f of fails) console.log(`  FAIL: ${f}`);
  process.exit(1);
}

process.exit(0);
