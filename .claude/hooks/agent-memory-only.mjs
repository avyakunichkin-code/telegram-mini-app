#!/usr/bin/env node
/**
 * PreToolUse (Edit|Write|MultiEdit|NotebookEdit) в frontmatter read-only subagent'а с `memory: project`.
 * `memory` автоматически включает Read/Write/Edit — хук оставляет запись только в
 * `.claude/agent-memory/<agent>/`, всё остальное блокирует (exit 2 + stderr).
 * Использование (agent frontmatter → hooks.PreToolUse):
 *   node "${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-memory-only.mjs" <agent-name>
 * Self-test: node .claude/hooks/guards.test.mjs
 */
import { readFileSync } from 'fs';
import path from 'path';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const agent = process.argv[2];
let payload = {};
try {
  const raw = readStdin();
  payload = raw.trim() ? JSON.parse(raw) : {};
} catch {
  payload = {};
}

const toolInput = payload.tool_input ?? {};
const target = toolInput.file_path ?? toolInput.notebook_path ?? '';
const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

const memoryDir = agent ? path.resolve(projectDir, '.claude', 'agent-memory', agent) + path.sep : null;
const resolved = target ? path.resolve(payload.cwd || projectDir, target) : '';

if (memoryDir && resolved && fold(resolved).startsWith(fold(memoryDir))) process.exit(0);

process.stderr.write(
  `ТВОЙ ХОД guard: subagent ${agent || '(unknown)'} — read-only. ` +
    `Запись разрешена только в .claude/agent-memory/${agent || '<agent>'}/ (persistent memory), ` +
    `а не в ${target || '(no path)'}. Предложи правку текстом в отчёте.\n`,
);
process.exit(2);
