#!/usr/bin/env node
/**
 * Print catalog read_if for a skill — copy `when` keys into MQ-* read_if_when.
 * Usage: node .cursor/skills/skill-test/_resolve-read-if.mjs <skill-name>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const catalogPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../catalog.yaml',
);

const skillName = process.argv[2];
if (!skillName) {
  console.error('Usage: node _resolve-read-if.mjs <skill-name>');
  process.exit(1);
}

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function skillBlock(skillsBlock, name) {
  const parts = skillsBlock.split(new RegExp(`^\\s{2}${name}:\\r?\\n`, 'm'));
  if (parts.length < 2) return '';
  const rest = parts[1];
  const end = rest.search(/^\s{2}[\w-]+:\s*$/m);
  return end >= 0 ? rest.slice(0, end) : rest;
}

function parseReadIf(block) {
  const m = block.match(
    /^\s{6}read_if:\s*\r?\n([\s\S]*?)(?=^\s{6}[a-z_]+:\s*$|^\s{4}[a-z_]+:\s*$)/m,
  );
  if (!m) return [];
  const entries = [];
  for (const part of m[1].split(/^\s{8}- when:/m).filter((s) => s.trim())) {
    const whenLine = part.match(/^[^\r\n]+/);
    if (!whenLine) continue;
    const when = whenLine[0].trim().replace(/^["']|["']$/g, '');
    const paths = [...part.matchAll(/^\s{12}- (.+)$/gm)].map((x) =>
      x[1].trim().replace(/^["']|["']$/g, ''),
    );
    entries.push({ when, paths });
  }
  return entries;
}

const text = stripBom(fs.readFileSync(catalogPath, 'utf8'));
const mSkills = text.match(/(?:^|\r?\n)skills:\r?\n([\s\S]*?)(?:\r?\nagents:|\s*$)/);
const skillsBlock = mSkills ? mSkills[1] : '';
const block = skillBlock(skillsBlock, skillName);

if (!block) {
  console.error(`Skill not found in catalog: ${skillName}`);
  process.exit(1);
}

const entries = parseReadIf(block);
if (!entries.length) {
  console.log(`# ${skillName}\n\n(no read_if in catalog — omit read_if_when in MQ-*)`);
  process.exit(0);
}

console.log(`# ${skillName} — read_if (catalog.yaml)\n`);
console.log('| read_if_when (copy matching only) | paths |');
console.log('|-----------------------------------|-------|');
for (const e of entries) {
  const paths = e.paths.map((p) => `\`${p}\``).join(', ');
  console.log(`| \`${e.when}\` | ${paths} |`);
}
console.log('\n**MQ-* frontmatter:**');
console.log('```yaml');
console.log('read_if_when:');
for (const e of entries) {
  console.log(`  - "${e.when}"  # only if this slice needs these paths`);
}
console.log('```');
