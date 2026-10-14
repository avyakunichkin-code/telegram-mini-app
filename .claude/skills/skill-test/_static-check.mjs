import fs from 'fs';
import path from 'path';

const skillsDir = '.claude/skills';
const dirs = fs
  .readdirSync(skillsDir)
  .filter(
    (d) =>
      !d.startsWith('_') &&
      fs.existsSync(path.join(skillsDir, d, 'SKILL.md')),
  )
  .sort();

const REQUIRED_FM = [
  'name:',
  'description:',
  'argument-hint:',
  'user-invocable:',
  'allowed-tools:',
];
const VERDICT_KW = [
  'PASS',
  'FAIL',
  'CONCERNS',
  'APPROVED',
  'BLOCKED',
  'COMPLETE',
  'READY',
  'COMPLIANT',
  'NON-COMPLIANT',
];

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { raw: '', body: content };
  return { raw: m[1], body: content.slice(m[0].length) };
}

function countPhases(body) {
  const phaseHeadings = body.match(/^## (?:Phase \d+|Phase \d+:|\d+\.)/gm) || [];
  const allH2 = body.match(/^## /gm) || [];
  return { phaseLike: phaseHeadings.length, h2: allH2.length };
}

function hasAskBeforeWrite(body) {
  if (/May I write|Могу записать/i.test(body)) return true;
  if (/before writing/i.test(body) || /approval/i.test(body)) return true;
  if (/READ-ONLY|только читает|По умолчанию только чтение/i.test(body)) return true;
  const sections = body.split(/^## /m);
  for (const sec of sections) {
    if (/ask/i.test(sec) && /write/i.test(sec)) return true;
  }
  return false;
}

function hasWriteTools(fmRaw) {
  const m = fmRaw.match(/allowed-tools:\s*(.+)/i);
  if (!m) return false;
  return /Write|Edit/i.test(m[1]);
}

function hasHandoff(body) {
  const patterns = [
    /recommended next/i,
    /next step/i,
    /follow-up/i,
    /after this/i,
    /Следующий шаг/i,
    /Итог \(Verdict\)/i,
  ];
  for (const p of patterns) {
    if (p.test(body)) return true;
  }
  const tail = body.slice(Math.floor(body.length * 0.65));
  if (/\/[a-z][a-z0-9-]*/.test(tail)) return true;
  return false;
}

const results = [];

// Claude Code skill contract — https://code.claude.com/docs/en/skills
const CLAUDE_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell',
  'WebFetch', 'WebSearch', 'AskUserQuestion', 'TodoWrite', 'Agent', 'Skill', 'LSP',
]);
const MAX_SKILL_LINES = 500;
const MAX_DESCRIPTION_CHARS = 1536;

/** Split `allowed-tools` respecting parentheses: "Read, Bash(a, b)" → ["Read", "Bash(a, b)"]. */
function splitTools(value) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function claudeContractIssues(rawContent, fm) {
  const issues = [];
  if (rawContent.charCodeAt(0) === 0xfeff) issues.push('C1: UTF-8 BOM — Claude ignores frontmatter');
  if (!/^---\r?\n/.test(stripBom(rawContent))) issues.push('C1: frontmatter `---` is not the first line');
  const toolsLine = fm.match(/^allowed-tools:\s*(.+)$/m);
  if (toolsLine) {
    for (const tool of splitTools(toolsLine[1])) {
      const base = tool.replace(/\(.*\)$/, '');
      if (tool.startsWith('mcp__')) continue;
      if (!CLAUDE_TOOLS.has(base)) issues.push(`C2: unknown tool "${tool}" in allowed-tools`);
      else if ((base === 'Bash' || base === 'PowerShell') && !tool.includes('(')) {
        issues.push(`C2: unscoped "${base}" pre-approves any command — use ${base}(cmd *)`);
      }
    }
  }
  if (/^disable-model-invocation:\s*(true|yes|on|1)\s*$/im.test(fm) && /^user-invocable:\s*(false|no|off|0)\s*$/im.test(fm)) {
    issues.push('C3: disable-model-invocation + user-invocable:false — skill is unreachable');
  }
  return issues;
}

function descriptionLength(fm) {
  const m = fm.match(/^description:\s*(>-?|\|-?)?\s*\r?\n?([\s\S]*?)(?=^\S[\w-]*:|$(?![\s\S]))/m);
  if (!m) return 0;
  return m[2].replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '').length;
}

for (const name of dirs) {
  const rawContent = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8');
  const content = stripBom(rawContent);
  const { raw: fm, body } = parseFrontmatter(content);
  const issues = [];
  const warnings = [];
  let failures = 0;
  let warns = 0;

  const missingFm = REQUIRED_FM.filter((f) => !fm.includes(f));
  if (missingFm.length) {
    failures++;
    issues.push(`Check 1: missing ${missingFm.join(', ')}`);
  }

  for (const issue of claudeContractIssues(rawContent, fm)) {
    failures++;
    issues.push(issue);
  }
  const lineCount = content.split('\n').length;
  if (lineCount > MAX_SKILL_LINES) {
    warns++;
    warnings.push(`C4: SKILL.md has ${lineCount} lines (> ${MAX_SKILL_LINES}) — move detail to supporting files`);
  }
  const descLen = descriptionLength(fm);
  if (descLen > MAX_DESCRIPTION_CHARS) {
    failures++;
    issues.push(`C5: description ${descLen} chars (> ${MAX_DESCRIPTION_CHARS}, truncated in skill listing)`);
  }

  const { phaseLike, h2 } = countPhases(body);
  const phaseCount = phaseLike >= 2 ? phaseLike : h2;
  if (phaseCount < 2) {
    failures++;
    issues.push(`Check 2: only ${phaseCount} phase-like headings`);
  }

  const foundVerdict = VERDICT_KW.filter((k) => content.includes(k));
  if (!foundVerdict.length) {
    failures++;
    issues.push('Check 3: no verdict keywords');
  }

  const writeTools = hasWriteTools(fm);
  const askLang = hasAskBeforeWrite(body);
  if (writeTools && !askLang) {
    failures++;
    issues.push('Check 4: Write/Edit allowed but no ask-before-write');
  } else if (!askLang) {
    warns++;
    warnings.push('Check 4: no collaborative protocol language');
  }

  if (!hasHandoff(body)) {
    warns++;
    warnings.push('Check 5: no next-step handoff');
  }

  if (/context:\s*fork/i.test(fm) && phaseCount < 5) {
    warns++;
    warnings.push(`Check 6: context:fork but only ${phaseCount} phases`);
  }

  const hintMatch = fm.match(/argument-hint:\s*(.*)/);
  const hint = hintMatch ? hintMatch[1].trim() : '';
  if (!hint || hint === '""' || hint === "''") {
    warns++;
    warnings.push('Check 7: empty argument-hint');
  }

  let verdict;
  if (failures > 0) verdict = 'NON-COMPLIANT';
  else if (warns > 0) verdict = 'WARNINGS';
  else verdict = 'COMPLIANT';

  results.push({ name, verdict, failures, warns, issues, warnings });
}

const compliant = results.filter((r) => r.verdict === 'COMPLIANT').length;
const warningCount = results.filter((r) => r.verdict === 'WARNINGS').length;
const nonCompliant = results.filter((r) => r.verdict === 'NON-COMPLIANT').length;

console.log(`=== Skill Static Check: ${results.length} skills ===\n`);
for (const r of results) {
  const note = r.issues[0] || r.warnings[0] || '';
  console.log(`${r.name.padEnd(32)} ${r.verdict.padEnd(14)} ${note}`);
}
console.log(`\nSummary: ${compliant} COMPLIANT, ${warningCount} WARNINGS, ${nonCompliant} NON-COMPLIANT`);
