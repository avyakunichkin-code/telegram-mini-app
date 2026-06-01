import fs from 'fs';
import path from 'path';

const ROOT = '.cursor/skills';
const CATALOG_PATH = path.join(ROOT, 'catalog.yaml');
const RUBRIC_PATH = path.join(ROOT, 'quality-rubric.md');

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { fm: '', body: content };
  return { fm: m[1], body: content.slice(m[0].length) };
}

function hasField(fm, key) {
  return new RegExp(`^${key}:`, 'm').test(fm);
}

function parseCatalogSkills(text) {
  // Minimal YAML-ish parser: supports CRLF/LF; stops before `agents:`.
  const mSkills = text.match(/(?:^|\r?\n)skills:\r?\n([\s\S]*?)(?:\r?\nagents:|\s*$)/);
  const skillsBlock = mSkills ? mSkills[1] : '';
  const names = [...skillsBlock.matchAll(/^\s{2}([\w-]+):\s*$/gm)].map((m) => m[1]);
  const get = (name, key) => {
    const part = skillsBlock.split(new RegExp(`^\\s{2}${name}:\\r?\\n`, 'm'))[1];
    if (!part) return null;
    const line = part.match(new RegExp(`^\\s{4}${key}:\\s*(.+)$`, 'm'));
    return line ? line[1].trim().replace(/^\"|\"$/g, '') : null;
  };
  return { names, get };
}

function hasVerdict(body) {
  return /(PASS|FAIL|CONCERNS|APPROVED|COMPLETE|BLOCKED|READY|COMPLIANT|NON-COMPLIANT)/.test(body);
}

function allowedToolsHasWrite(fm) {
  const m = fm.match(/^allowed-tools:\s*(.+)$/m);
  if (!m) return false;
  return /\bWrite\b|\bEdit\b/i.test(m[1]);
}

function hasAskBeforeWrite(body) {
  return /May I write|Могу записать|ask[- ]before[- ]write|before writing/i.test(body);
}

function isReadOnly(body, fm) {
  if (/READ-ONLY|READ ONLY|только чтение|only read/i.test(body)) return true;
  // Heuristic: no Write/Edit in allowed-tools often implies read-only intent.
  return !allowedToolsHasWrite(fm);
}

function hasHandoff(body) {
  const tail = body.slice(Math.floor(body.length * 0.6));
  return /Следующий шаг|next step|follow-up|\/[a-z][a-z0-9-]*/i.test(tail);
}

function kw(body, re) {
  return re.test(body);
}

function metric(pass, warnReason = '') {
  return pass ? { s: 'PASS' } : { s: 'WARN', r: warnReason || 'heuristic not satisfied' };
}

const catalogText = stripBom(fs.readFileSync(CATALOG_PATH, 'utf8'));
const rubricExists = fs.existsSync(RUBRIC_PATH);
if (!rubricExists) {
  console.log(`BLOCKED: missing rubric at ${RUBRIC_PATH}`);
  process.exit(1);
}

const { names, get } = parseCatalogSkills(catalogText);

/** @type {Array<{name:string, category:string, verdict:string, warns:string[]}>} */
const out = [];

for (const name of names) {
  const category = get(name, 'category') ?? 'unknown';
  const status = get(name, 'status') ?? 'active';
  const skillPath =
    status === 'archived'
      ? path.join(ROOT, '_archived', name, 'SKILL.md')
      : path.join(ROOT, name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    out.push({
      name,
      category,
      verdict: 'NON-COMPLIANT',
      warns: [`SKILL.md missing at ${skillPath}`],
    });
    continue;
  }
  const content = stripBom(fs.readFileSync(skillPath, 'utf8'));
  const { fm, body } = parseFrontmatter(content);

  const warns = [];

  // Common G-metrics (WARN-only; static check already enforces hard failures)
  if (!['name', 'description', 'argument-hint', 'user-invocable', 'allowed-tools'].every((k) => hasField(fm, k))) {
    warns.push('G1: frontmatter contract not fully present');
  }
  if (!hasVerdict(content)) warns.push('G2: verdict keyword not found');
  const hasWrite = allowedToolsHasWrite(fm);
  if (hasWrite && !hasAskBeforeWrite(body)) warns.push('G3: Write allowed but no ask-before-write phrase');
  if (!hasWrite && !isReadOnly(body, fm)) warns.push('G3: read-only not explicitly stated');
  if (!hasHandoff(body)) warns.push('G4: next-step handoff not found');

  // Category heuristics (WARN-only)
  if (category === 'api') {
    if (!kw(body, /contract first|Contract First|схем|schema|контракт/i)) warns.push('A1: contract-first language not obvious');
    if (!kw(body, /deprecat|миграц|backward|совместим|additive/i)) warns.push('A2: backward compatibility/deprecation not obvious');
  } else if (category === 'build') {
    if (!kw(body, /Phase|шаг|slice|инкремент/i)) warns.push('B1: incrementality not obvious');
    if (!kw(body, /verify|провер|test|devtools/i)) warns.push('B2: verification hook not obvious');
  } else if (category === 'define') {
    if (!kw(body, /acceptance|критер|AC|Success criteria/i)) warns.push('D1: acceptance criteria not obvious');
    if (!kw(body, /do not advance|не переходи|gate|Human reviews/i)) warns.push('D2: gate language not obvious');
  } else if (category === 'review') {
    if (!isReadOnly(body, fm)) warns.push('R1: read-only not obvious');
    if (!kw(body, /blocking|advisory|severity|P0|P1|P2/i)) warns.push('R2: severity levels not obvious');
  } else if (category === 'verify') {
    if (!kw(body, /evidence|repro|measure|профил|network|console|DOM|измер/i)) warns.push('V1: evidence-based language not obvious');
    if (!kw(body, /risk|опас|security|hardening|careful|высокие ставки/i)) warns.push('V2: safety language not obvious');
  } else if (category === 'ship') {
    if (!kw(body, /docs\/|ADR|canon|релиз|launch|merge/i)) warns.push('S1: docs/release handoff not obvious');
    if (name === 'social-changelog-posts' && !kw(body, /не публиковать|no auto|утверждаем|approval/i))
      warns.push('S2: publish safety not obvious');
  } else if (category === 'meta') {
    if (!kw(body, /CURSOR_SKILLS\.md|catalog\.yaml|rules|skills/i)) warns.push('M1: repo conventions refs not obvious');
  } else if (category === 'studio') {
    if (!kw(body, /deliverable|outputs|write|документ|матриц|report|шаблон/i)) warns.push('ST1: deliverable not obvious');
    if (!kw(body, /APPROVED|NEEDS REVISION|CONCERNS|PASS|FAIL/i)) warns.push('ST2: gate language not obvious');
  }

  out.push({
    name,
    category,
    verdict: warns.length ? 'WARNINGS' : 'COMPLIANT',
    warns,
  });
}

const compliant = out.filter((x) => x.verdict === 'COMPLIANT').length;
const warnings = out.filter((x) => x.verdict === 'WARNINGS').length;
const nonCompliant = out.filter((x) => x.verdict === 'NON-COMPLIANT').length;

console.log(`=== Skill Category Check: all (${out.length}) ===`);
console.log(`Rubric: ${RUBRIC_PATH}`);
console.log('');
for (const r of out) {
  const first = r.warns[0] ? ` — ${r.warns[0]}` : '';
  console.log(`${r.name.padEnd(32)} ${String(r.category).padEnd(10)} ${r.verdict}${first}`);
}
console.log('');
console.log(`Summary: ${compliant} COMPLIANT, ${warnings} WARNINGS, ${nonCompliant} NON-COMPLIANT`);
console.log('');
console.log('--- WARNINGS DETAILS ---');
for (const r of out.filter((x) => x.warns.length)) {
  console.log(`\n/${r.name} (${r.category}):`);
  for (const w of r.warns) console.log(`  WARN: ${w}`);
}

