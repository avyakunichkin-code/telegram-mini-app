#!/usr/bin/env node
/**
 * Claude Code config contract: .claude/rules, .claude/agents, .claude/settings.json hooks.
 * Docs: https://code.claude.com/docs/en/memory · /sub-agents · /hooks
 * Exit 1 on FAIL. Run from repo root: node .claude/skills/skill-test/_claude-config-check.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RULES_DIR = '.claude/rules';
const AGENTS_DIR = '.claude/agents';
const SETTINGS = '.claude/settings.json';
const AGENT_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell',
  'WebFetch', 'WebSearch', 'TodoWrite', 'Agent', 'Skill', 'LSP', 'ToolSearch', 'Monitor', 'SendMessage',
]);

const fails = [];
const warns = [];
const ok = [];

function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

function yamlList(fm, key) {
  const block = fm.match(new RegExp(`^${key}:\\s*\\r?\\n((?:\\s+-\\s+.+\\r?\\n?)+)`, 'm'));
  if (block) return [...block[1].matchAll(/-\s+["']?([^"'\r\n]+)["']?/g)].map((x) => x[1].trim());
  const inline = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return inline ? inline[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/** Minimal glob → RegExp (**, *, ?, {a,b}). */
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*';
        i += glob[i + 2] === '/' ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      re += `(?:${glob.slice(i + 1, end).split(',').map((s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|')})`;
      i = end;
    } else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

const tracked = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .filter(Boolean);

// --- Rules ---
for (const file of fs.readdirSync(RULES_DIR).filter((f) => f.endsWith('.md')).sort()) {
  const p = path.join(RULES_DIR, file);
  const raw = fs.readFileSync(p, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) fails.push(`rule ${file}: UTF-8 BOM — frontmatter ignored, rule loads always`);
  const fm = frontmatter(raw.replace(/^﻿/, ''));
  if (fm === null) {
    ok.push(`rule ${file}: always loaded (no paths)`);
    continue;
  }
  const unknown = [...fm.matchAll(/^([\w-]+):/gm)].map((m) => m[1]).filter((k) => k !== 'paths');
  if (unknown.length) fails.push(`rule ${file}: unsupported frontmatter keys (${unknown.join(', ')}) — only \`paths\` is read`);
  const inline = fm.match(/^paths:[ 	]*(\S.+)$/m);
  if (inline && /\{[^}]*,/.test(inline[1])) fails.push(`rule ${file}: comma-separated paths with {a,b} braces — use a YAML list`);
  const globs = yamlList(fm, 'paths');
  if (!globs.length) {
    fails.push(`rule ${file}: frontmatter without paths`);
    continue;
  }
  const dead = globs.filter((g) => !tracked.some((f) => globToRegExp(g).test(f)));
  if (dead.length === globs.length) fails.push(`rule ${file}: no tracked file matches any path (${globs.join(', ')})`);
  else if (dead.length) warns.push(`rule ${file}: paths match nothing: ${dead.join(', ')}`);
  else ok.push(`rule ${file}: ${globs.length} path(s) OK`);
}

// --- Agents ---
for (const file of fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort()) {
  const raw = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
  const fm = frontmatter(raw.replace(/^﻿/, ''));
  if (!fm) {
    fails.push(`agent ${file}: no frontmatter — Claude skips it silently`);
    continue;
  }
  const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !/^description:/m.test(fm)) fails.push(`agent ${file}: name and description are required`);
  if (name && name.includes(':')) fails.push(`agent ${file}: name must not contain ':'`);
  const tools = fm.match(/^tools:\s*(.+)$/m)?.[1];
  if (!tools) warns.push(`agent ${file}: no tools allowlist — inherits every tool (least privilege)`);
  else {
    for (const t of tools.split(',').map((s) => s.trim())) {
      if (!AGENT_TOOLS.has(t.replace(/\(.*\)$/, '')) && !t.startsWith('mcp__')) fails.push(`agent ${file}: unknown tool "${t}"`);
    }
  }
  if (/read-only|readonly/i.test(raw) && tools && /\b(Write|Edit)\b/.test(tools) && !/^disallowedTools:.*\b(Write|Edit)\b/m.test(fm)) {
    warns.push(`agent ${file}: described as read-only but tools include Write/Edit`);
  }
  const memory = fm.match(/^memory:\s*(\S+)/m)?.[1];
  if (memory && !['user', 'project', 'local'].includes(memory)) fails.push(`agent ${file}: memory must be user|project|local, got "${memory}"`);
  // memory auto-enables Read/Write/Edit — a read-only agent needs a PreToolUse guard limiting writes to its memory dir
  if (memory && /read-only|readonly/i.test(raw) && !/agent-memory-only\.mjs/.test(fm)) {
    warns.push(`agent ${file}: read-only with memory: ${memory} but no agent-memory-only.mjs PreToolUse hook — Write/Edit are unrestricted`);
  }
  for (const script of fm.matchAll(/\.claude\/hooks\/[\w.-]+/g)) {
    if (!fs.existsSync(script[0])) fails.push(`agent ${file}: hook script missing ${script[0]}`);
  }
  ok.push(`agent ${name ?? file}${memory ? ` (memory: ${memory})` : ''}`);
}

// --- Hooks ---
const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (hook.type !== 'command') continue;
      const script = hook.command.match(/\.claude\/hooks\/[\w.-]+/)?.[0];
      if (script && !fs.existsSync(script)) fails.push(`hook ${event}: script missing ${script}`);
      else if (script) {
        const src = fs.readFileSync(script, 'utf8');
        if (/additional_context/.test(src)) fails.push(`hook ${event}: ${script} emits Cursor \`additional_context\` — use hookSpecificOutput.additionalContext`);
        else ok.push(`hook ${event} → ${script}`);
      }
    }
  }
}

console.log('=== Claude config check ===');
for (const line of ok) console.log(`OK    ${line}`);
for (const line of warns) console.log(`WARN  ${line}`);
for (const line of fails) console.log(`FAIL  ${line}`);
console.log(`\nSummary: ${ok.length} OK, ${warns.length} WARN, ${fails.length} FAIL`);
process.exit(fails.length ? 1 : 0);
