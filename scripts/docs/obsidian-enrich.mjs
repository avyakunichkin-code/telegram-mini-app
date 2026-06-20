#!/usr/bin/env node
/**
 * Obsidian frontmatter enricher for ТВОЙ ХОД docs.
 * Adds/updates `tags` and `aliases` without converting markdown links.
 *
 * Usage: node scripts/docs/obsidian-enrich.mjs [--check]
 *   --check  exit 1 if any file would change (CI-friendly)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK_ONLY = process.argv.includes('--check');

const EXTRA_FILES = ['CLAUDE.md', 'landing/README.md'];

/** @param {string} relPath POSIX path from repo root */
function detectLayer(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (p === 'CLAUDE.md') return 'agent';
  if (p === 'landing/README.md') return 'landing';
  if (p === 'docs/README.md') return 'index';
  if (p === 'docs/Home.md' || p === 'docs/OBSIDIAN.md') return 'obsidian';
  if (p === 'docs/DOCUMENTATION_SYSTEM.md') return 'system';
  if (p === 'docs/TRACEABILITY.md') return 'trace';
  if (p.startsWith('docs/handbook/')) return 'handbook';
  if (p.startsWith('docs/foundation/')) return 'foundation';
  if (p.startsWith('docs/vision/ideas/')) return 'idea';
  if (p.startsWith('docs/vision/')) return 'vision';
  if (p.startsWith('docs/specs/features/')) return 'spec';
  if (p.startsWith('docs/specs/')) return 'spec';
  if (p.startsWith('docs/plans/')) return 'plan';
  if (p.startsWith('docs/tasks/')) return 'task';
  if (p.startsWith('docs/decisions/')) return 'adr';
  if (p.startsWith('docs/backlog/')) return 'backlog';
  if (p.startsWith('docs/reference/')) return 'reference';
  if (p.startsWith('docs/marketing/')) return 'marketing';
  if (p.startsWith('docs/ops/')) return 'ops';
  if (p.startsWith('docs/agents/')) return 'agents';
  if (p.startsWith('docs/ux/')) return 'ux';
  if (p.startsWith('docs/templates/')) return 'template';
  if (p.startsWith('docs/architecture/')) return 'architecture';
  if (p.startsWith('docs/balance/')) return 'balance';
  if (p.endsWith('/_index.md')) return 'moc';
  return 'docs';
}

/** @param {string} content */
function extractTitle(content) {
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function normalizeContent(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

/** @param {string} content */
function splitFrontmatter(content) {
  content = normalizeContent(content);
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { fm: null, body: content };
  }
  const end = content.indexOf('\n---\n', 4);
  const endCr = content.indexOf('\n---\r\n', 4);
  const idx = end === -1 ? endCr : endCr === -1 ? end : Math.min(end, endCr);
  if (idx === -1) return { fm: null, body: content };
  let fm = content.slice(4, idx);
  fm = fm.replace(/^\s*\n/, ''); // blank line after opening ---
  const body = content.slice(idx + (content[idx + 4] === '\r' ? 6 : 5));
  return { fm, body };
}

/** @param {string} fmText */
function parseFmFields(fmText) {
  /** @type {Record<string, string>} */
  const scalar = {};
  /** @type {string[]} */
  const tracksList = [];

  const lines = fmText.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    const [, key, rest] = keyMatch;
    if (rest === '' || rest === null) {
      const list = [];
      i += 1;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        list.push(lines[i].replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim());
        i += 1;
      }
      if (key === 'tracks') tracksList.push(...list);
      continue;
    }
    scalar[key] = rest.replace(/^["']|["']$/g, '').trim();
    if (key === 'tracks' && rest) {
      tracksList.push(...rest.split(',').map((s) => s.trim()));
    }
    i += 1;
  }

  return { scalar, tracksList };
}

/** @param {string} relPath @param {string|null} title @param {{ scalar: Record<string, string>, tracksList: string[] }} fm */
function buildAliases(relPath, title, fm) {
  /** @type {Set<string>} */
  const aliases = new Set();
  const base = path.basename(relPath, '.md');

  if (base !== 'README' && base !== '_index') aliases.add(base);

  const adr = base.match(/^(ADR-\d+)/);
  if (adr) aliases.add(adr[1]);

  const planSpec = base.match(/^(PLAN|SPEC)_(.+)/);
  if (planSpec) {
    aliases.add(`${planSpec[1]}_${planSpec[2]}`);
    aliases.add(`${planSpec[1]} ${planSpec[2].replace(/-/g, ' ')}`);
  }

  if (title) {
    aliases.add(title);
    const short = title.replace(/^(Spec|ADR|Plan|Idea|Эпик|Review):\s*/i, '').trim();
    if (short && short !== title) aliases.add(short);
  }

  if (fm.scalar.epic_id) aliases.add(fm.scalar.epic_id);

  for (const t of fm.tracksList) {
    const epic = t.match(/\b([A-Z]{1,4}\d+)\b/);
    if (epic) aliases.add(epic[1]);
  }

  // TRACEABILITY-style IDs in filename
  const idInName = base.match(/\b([A-Z]\d+)\b/);
  if (idInName) aliases.add(idInName[1]);

  return [...aliases].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru')).slice(0, 10);
}

/** @param {string} relPath @param {{ scalar: Record<string, string>, tracksList: string[] }} fm */
function buildTags(relPath, fm) {
  const layer = detectLayer(relPath);
  /** @type {Set<string>} */
  const tags = new Set([`tvoy-hod/layer/${layer}`]);

  const status = fm.scalar.status || fm.scalar.deciders ? fm.scalar.status : null;
  if (status) {
    tags.add(`tvoy-hod/status/${status.replace(/\s+/g, '-').toLowerCase()}`);
  } else if (fm.scalar.deciders) {
    tags.add('tvoy-hod/status/accepted');
  }

  for (const t of fm.tracksList.slice(0, 4)) {
    const slug = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug) tags.add(`tvoy-hod/topic/${slug}`);
  }

  if (fm.scalar.layer) {
    tags.add(`tvoy-hod/layer/${fm.scalar.layer}`);
  }

  return [...tags].sort();
}

/** @param {string} value */
function yamlQuote(value) {
  if (/[:#\[\]{}|>&*!%@`]/.test(value) || value.includes('"')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value.includes(' ') ? `"${value}"` : value;
}

/** @param {string[]} items */
function formatYamlList(key, items) {
  if (items.length === 0) return `${key}: []`;
  return [key + ':', ...items.map((item) => `  - ${yamlQuote(item)}`)].join('\n');
}

/** @param {string|null} fm @param {string[]} tags @param {string[]} aliases */
function mergeFrontmatter(fm, tags, aliases) {
  let fmText = fm ?? '';
  fmText = fmText.replace(/\r\n/g, '\n');
  fmText = fmText.replace(/^tags:[^\n]*(?:\n(?:  - .+|  - ".+"))*/m, '');
  fmText = fmText.replace(/^aliases:[^\n]*(?:\n(?:  - .+|  - ".+"))*/m, '');
  fmText = fmText.replace(/\n{3,}/g, '\n\n').trimEnd();

  const blocks = [fmText, formatYamlList('tags', tags), formatYamlList('aliases', aliases)].filter(Boolean);
  return blocks.join('\n');
}

/** @param {string} dir */
function walkMarkdown(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      walkMarkdown(abs, out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(abs);
    }
  }
  return out;
}

function collectFiles() {
  /** @type {string[]} */
  const files = walkMarkdown(path.join(ROOT, 'docs'));
  for (const rel of EXTRA_FILES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) files.push(abs);
  }
  return files;
}

/** @param {string} absPath */
function processFile(absPath) {
  const relPath = path.relative(ROOT, absPath).replace(/\\/g, '/');
  let content = fs.readFileSync(absPath, 'utf8');
  content = normalizeContent(content);

  // Repair accidental double frontmatter from BOM pass
  const doubleFm = content.match(/^---\n[\s\S]*?\n---\n---\n/);
  if (doubleFm) {
    content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  const { fm, body } = splitFrontmatter(content);
  const title = extractTitle(content);
  const fmParsed = parseFmFields(fm ?? '');

  const tags = buildTags(relPath, fmParsed);
  const aliases = buildAliases(relPath, title, fmParsed);
  const newFm = mergeFrontmatter(fm, tags, aliases);
  const newContent = `---\n${newFm}\n---\n${body.replace(/^\r?\n/, '')}`;

  const normalizedCurrent = normalizeContent(content);
  if (newContent === normalizedCurrent) return false;

  if (!CHECK_ONLY) {
    fs.writeFileSync(absPath, newContent, 'utf8');
  }
  return true;
}

function main() {
  const files = collectFiles();
  let changed = 0;
  for (const abs of files) {
    if (processFile(abs)) {
      changed += 1;
      if (CHECK_ONLY) {
        console.log(`would update: ${path.relative(ROOT, abs).replace(/\\/g, '/')}`);
      }
    }
  }

  const mode = CHECK_ONLY ? 'check' : 'write';
  console.log(`obsidian-enrich (${mode}): ${files.length} files, ${changed} ${CHECK_ONLY ? 'drift' : 'updated'}`);

  if (CHECK_ONLY && changed > 0) process.exit(1);
}

main();
