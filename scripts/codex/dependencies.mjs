import fs from 'node:fs';
import path from 'node:path';

const hiddenSources = new Set(['.agents', '.codex', '.github', '.well-known', '.venv', '.codex-state', '.obsidian', '.openai']);
const rootDocuments = new Set(['agents.md', 'readme.md', 'conventions.md', 'architecture.md']);

// Only current project instruction locations are valid; retired names need no special cases.
export function isLegacySource(value, fromFile = '') {
  let target = String(value).replaceAll('\\', '/').replace(/^<|>$/g, '');
  try { target = decodeURIComponent(target); } catch { return true; }
  if (/^[a-z]+:\/\//i.test(target) || target.startsWith('#')) return false;
  target = target.split('#')[0].split('?')[0];
  const parts = target.toLowerCase().split('/');
  if (parts.slice(0, -1).some(part => /^\.[^.]/.test(part) && !hiddenSources.has(part))) return true;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile.replaceAll('\\', '/')), target)).toLowerCase().replace(/^(?:\.\.\/)+/, '');
  return !resolved.includes('/') && resolved.endsWith('.md') && !rootDocuments.has(resolved);
}

export function legacyDependencies(text, fromFile = '') {
  const found = new Set();
  const inspect = target => { if (isLegacySource(target, fromFile)) found.add(target); };
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)|\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) inspect(match[1] ?? match[2]);
  for (const match of text.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)) inspect(match[1]);
  // Inspect plain reading instructions and executable paths, without treating prose as IO.
  for (const match of text.matchAll(/(?:прочитай|прочтите|читай|читайте|read|get-content|cat|type|node|bash|python|py)\s+[\x60"']?([^\s\x60"'<>),;]+)/gi)) inspect(match[1]);
  return [...found];
}

export function markdownFiles(root, dirs) {
  const files = [];
  const skip = new Set(['node_modules', 'dist', 'worktrees', '__pycache__', 'archive', 'agent-migration-2026-11-11']);
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name) || (entry.name.startsWith('.') && !hiddenSources.has(entry.name)) || entry.isSymbolicLink()) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.md')) files.push(path.relative(root, file));
    }
  }
  for (const dir of dirs) walk(path.join(root, dir));
  return files;
}
