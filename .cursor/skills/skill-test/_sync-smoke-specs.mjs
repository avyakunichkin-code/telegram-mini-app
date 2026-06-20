#!/usr/bin/env node
/**
 * Regenerate minimal smoke stub specs (dedup vs SMOKE_STUB.md).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const skillTestDir = path.dirname(fileURLToPath(import.meta.url));
const specsRoot = path.resolve(skillTestDir, '../specs');
const catalogPath = path.resolve(skillTestDir, '../catalog.yaml');

/** Skills whose spec is only smoke (expand before strict /skill-test spec). */
const SMOKE_ONLY = new Set([
  'browser-testing-with-devtools',
  'code-review',
  'code-simplification',
  'deprecation-and-migration',
  'documentation-and-adrs',
  'doubt-driven-development',
  'performance-optimization',
  'project-cursor-skills-layout',
  'security-and-hardening',
  'skill-test',
  'social-changelog-posts',
  'brainstorm',
  'design-review',
  'design-system',
  'ux-design',
  'ux-review',
  'team-ui',
  'create-architecture',
  'architecture-review',
  'onboard',
  'retrospective',
]);

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseCatalog(text) {
  const mSkills = text.match(/(?:^|\r?\n)skills:\r?\n([\s\S]*?)(?:\r?\nagents:|\s*$)/);
  const skillsBlock = mSkills ? mSkills[1] : '';
  const names = [...skillsBlock.matchAll(/^\s{2}([\w-]+):\s*$/gm)].map((x) => x[1]);

  function skillBlock(name) {
    const parts = skillsBlock.split(new RegExp(`^\\s{2}${name}:\\r?\\n`, 'm'));
    if (parts.length < 2) return '';
    const rest = parts[1];
    const end = rest.search(/^\s{2}[\w-]+:\s*$/m);
    return end >= 0 ? rest.slice(0, end) : rest;
  }

  function scalar(name, key) {
    const block = skillBlock(name);
    const line = block.match(new RegExp(`^\\s{4}${key}:\\s*(.+)$`, 'm'));
    return line ? line[1].trim().replace(/^["']|["']$/g, '') : null;
  }

  return { names, scalar };
}

function relShared(fromSpecFile) {
  const depth = fromSpecFile.split('/').length - 1;
  return `${'../'.repeat(depth)}_shared/SMOKE_STUB.md`;
}

function toSpecRel(specPath) {
  return specPath
    .replace(/^\.cursor\/skills\/specs\//, '')
    .replace(/^specs\//, '');
}

function writeStub(name, catalogSpecPath, category, priority, status) {
  const rel = toSpecRel(catalogSpecPath);
  const absSpec = path.join(specsRoot, rel);
  fs.mkdirSync(path.dirname(absSpec), { recursive: true });
  const sharedLink = relShared(rel);
  const skillDir = status === 'archived' ? `_archived/${name}` : name;
  const body = `# Skill Test Spec: /${name}

**Skill:** \`.cursor/skills/${skillDir}/SKILL.md\`  
**Category:** ${category} · **Priority:** ${priority}

> **Smoke stub** — общий протокол: [\`SMOKE_STUB.md\`](${sharedLink}). Расширить секцией ниже перед строгим \`/skill-test spec ${name}\`.

---

## Skill-specific fixtures

_(none — добавь Test Case 2+ и domain assertions перед strict spec test)_
`;
  fs.writeFileSync(absSpec, body);
  return absSpec;
}

const catalog = parseCatalog(stripBom(fs.readFileSync(catalogPath, 'utf8')));
let n = 0;

for (const name of SMOKE_ONLY) {
  if (!catalog.names.includes(name)) continue;
  const spec = catalog.scalar(name, 'spec');
  if (!spec || !spec.includes('/specs/')) continue;
  const category = catalog.scalar(name, 'category') ?? 'unknown';
  const priority = catalog.scalar(name, 'priority') ?? 'medium';
  const status = catalog.scalar(name, 'status') ?? 'active';
  const rel = spec.replace(/^\.cursor\/skills\//, '');
  writeStub(name, spec, category, priority, status);
  n++;
}

console.log(`Synced ${n} smoke stub specs → specs/_shared/SMOKE_STUB.md`);
