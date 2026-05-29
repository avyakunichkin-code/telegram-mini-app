import fs from 'fs';
import path from 'path';

const ROOT = '.cursor/skills';
const CATALOG_PATH = path.join(ROOT, 'catalog.yaml');
const MAP_PATH = 'docs/agents/SKILL_DOC_MAP.md';
const POCHITAY = '## Прочитай сначала';

const PIPELINE_SKILLS = [
  'idea-refine',
  'spec-driven-development',
  'planning-and-task-breakdown',
  'incremental-implementation',
  'test-driven-development',
  'code-review-and-quality',
  'frontend-ui-engineering',
  'design-lab-mqx',
  'api-and-interface-design',
];

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { body: content };
  return { body: content.slice(m[0].length) };
}

function parseCatalog(text) {
  const mSkills = text.match(/(?:^|\r?\n)skills:\r?\n([\s\S]*)$/);
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

  function list(name, key) {
    const block = skillBlock(name);
    // Under `context:` lists use 6-space key + 8-space items
    const mCtx = block.match(
      new RegExp(`^\\s{6}${key}:\\s*\\r?\\n((?:\\s{8}- .+\\r?\\n)*)`, 'm'),
    );
    if (mCtx) {
      return [...mCtx[1].matchAll(/^\s{8}- (.+)$/gm)].map((x) =>
        x[1].trim().replace(/^["']|["']$/g, ''),
      );
    }
    const m = block.match(
      new RegExp(`^\\s{4}${key}:\\s*\\r?\\n((?:\\s{6}- .+\\r?\\n)*)`, 'm'),
    );
    if (!m) return [];
    return [...m[1].matchAll(/^\s{6}- (.+)$/gm)].map((x) =>
      x[1].trim().replace(/^["']|["']$/g, ''),
    );
  }

  function hasContext(name) {
    return /^\s{4}context:\s*$/m.test(skillBlock(name));
  }

  return { names, scalar, list, hasContext, skillBlock };
}

function normalizePath(p) {
  let s = p
    .replace(/^\.\.\/(\.\.\/)+/g, '')
    .replace(/^\.\//, '')
    .replace(/\\/g, '/')
    .split('#')[0]
    .trim();
  if (s.startsWith('/')) s = s.slice(1);
  return s;
}

function extractPathsFromText(text) {
  const paths = new Set();
  for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
    const p = normalizePath(m[1]);
    if (p && !p.startsWith('http')) paths.add(p);
  }
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const raw = m[1].trim();
    if (/[/.]/.test(raw) && !raw.includes(' ')) paths.add(normalizePath(raw));
  }
  return paths;
}

function pochitaySection(body) {
  const idx = body.indexOf(POCHITAY);
  if (idx < 0) return '';
  const tail = body.slice(idx);
  const end = tail.search(/\n## (?!#)/);
  return end > 0 ? tail.slice(0, end) : tail;
}

function pathCovered(catalogPath, paths, body) {
  const c = normalizePath(catalogPath);
  if (!c) return true;
  const base = path.basename(c);
  for (const p of paths) {
    if (p === c || p.startsWith(c) || c.startsWith(p)) return true;
  }
  if (body.includes(c)) return true;
  if (base.length > 4 && body.includes(base)) return true;
  return false;
}

function pathExists(repoRoot, p) {
  const n = normalizePath(p);
  if (!n) return true;
  const full = path.join(repoRoot, n);
  if (n.endsWith('/')) {
    return fs.existsSync(full) && fs.statSync(full).isDirectory();
  }
  if (fs.existsSync(full)) return true;
  if (fs.existsSync(`${full}/`)) return true;
  return false;
}

function skillMdPath(name, status) {
  if (status === 'archived') {
    return path.join(ROOT, '_archived', name, 'SKILL.md');
  }
  return path.join(ROOT, name, 'SKILL.md');
}

const catalogText = stripBom(fs.readFileSync(CATALOG_PATH, 'utf8'));
const { names, scalar, list, hasContext } = parseCatalog(catalogText);
const repoRoot = process.cwd();

const mapIssues = [];
if (!fs.existsSync(MAP_PATH)) {
  mapIssues.push('SKILL_DOC_MAP.md missing');
} else {
  const mapText = fs.readFileSync(MAP_PATH, 'utf8');
  for (const s of PIPELINE_SKILLS) {
    if (!mapText.includes(s)) mapIssues.push(`map missing skill: ${s}`);
  }
  if (!mapText.includes('catalog.yaml')) mapIssues.push('map missing catalog.yaml ref');
}

/** @type {Array<{name:string, status:string, verdict:string, fails:string[], warns:string[]}>} */
const rows = [];

for (const name of names) {
  const status = scalar(name, 'status') ?? 'unknown';
  const fails = [];
  const warns = [];

  if (!hasContext(name)) {
    if (status === 'active' || status === 'optional') {
      fails.push('catalog: missing context: block');
    }
    rows.push({ name, status, verdict: fails.length ? 'NON-COMPLIANT' : 'COMPLIANT', fails, warns });
    continue;
  }

  const mustRead = list(name, 'must_read');
  const writesTo = list(name, 'writes_to');
  const nextSkill = list(name, 'next_skill');

  const skillPath = skillMdPath(name, status);
  if (!fs.existsSync(skillPath)) {
    fails.push(`SKILL.md not found at ${skillPath}`);
    rows.push({ name, status, verdict: 'NON-COMPLIANT', fails, warns });
    continue;
  }

  const body = parseFrontmatter(stripBom(fs.readFileSync(skillPath, 'utf8'))).body;
  const pochitay = pochitaySection(body);
  const pochitayPaths = extractPathsFromText(pochitay);
  const bodyPaths = extractPathsFromText(body);

  if (status === 'active') {
    if (!pochitay) fails.push('SKILL.md: missing «Прочитай сначала» section');
  } else if (status === 'optional' && !pochitay) {
    warns.push('SKILL.md: no «Прочитай сначала» (recommended for optional)');
  }

  for (const p of mustRead) {
    if (!pathCovered(p, pochitayPaths, body)) {
      fails.push(`must_read not in SKILL: ${p}`);
    } else if (pochitay && !pathCovered(p, pochitayPaths, '')) {
      warns.push(`must_read only outside «Прочитай»: ${p}`);
    }
    if (!pathExists(repoRoot, p)) {
      warns.push(`must_read path missing on disk: ${p}`);
    }
  }

  for (const w of writesTo) {
    const wn = normalizePath(w);
    if (wn && !body.includes(wn) && !body.includes(w.replace(/\/$/, ''))) {
      warns.push(`writes_to not mentioned in SKILL: ${w}`);
    }
  }

  for (const ns of nextSkill) {
    if (!body.includes(ns)) {
      warns.push(`next_skill not mentioned in SKILL: ${ns}`);
    }
  }
  if (
    nextSkill.length > 0 &&
    pochitay &&
    !/Дальше|next_skill|Следующий/i.test(pochitay)
  ) {
    warns.push('«Прочитай»: no «Дальше» / next_skill handoff line');
  }

  if (status === 'active' && nextSkill.length === 0 && !/using-agent-skills|skill-test/.test(name)) {
    warns.push('catalog: empty next_skill for active skill');
  }

  let verdict = 'COMPLIANT';
  if (fails.length) verdict = 'NON-COMPLIANT';
  else if (warns.length) verdict = 'WARNINGS';

  rows.push({ name, status, verdict, fails, warns });
}

const compliant = rows.filter((r) => r.verdict === 'COMPLIANT').length;
const warnings = rows.filter((r) => r.verdict === 'WARNINGS').length;
const nonCompliant = rows.filter((r) => r.verdict === 'NON-COMPLIANT').length;

console.log(`=== Skill Context Check: ${rows.length} skills ===`);
console.log(`Catalog: ${CATALOG_PATH}`);
console.log(`Map: ${MAP_PATH}`);
console.log('');

for (const r of rows) {
  const note = r.fails[0] || r.warns[0] || '';
  console.log(
    `${r.name.padEnd(32)} ${String(r.status).padEnd(9)} ${r.verdict.padEnd(14)} ${note}`,
  );
}

console.log('');
console.log(`Summary: ${compliant} COMPLIANT, ${warnings} WARNINGS, ${nonCompliant} NON-COMPLIANT`);

if (mapIssues.length) {
  console.log('\n--- SKILL_DOC_MAP ---');
  for (const i of mapIssues) console.log(`  FAIL: ${i}`);
} else {
  console.log('\nSKILL_DOC_MAP: PASS (pipeline skills + catalog ref)');
}

console.log('\n--- DETAILS (failures and warnings) ---');
for (const r of rows.filter((x) => x.fails.length || x.warns.length)) {
  console.log(`\n/${r.name} (${r.status}) ${r.verdict}:`);
  for (const f of r.fails) console.log(`  FAIL: ${f}`);
  for (const w of r.warns) console.log(`  WARN: ${w}`);
}

if (mapIssues.length) process.exitCode = 1;
else if (nonCompliant > 0) process.exitCode = 1;
