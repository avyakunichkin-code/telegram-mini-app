#!/usr/bin/env node
/**
 * PostToolUse (Bash) — сжимает длинный вывод тестов и сборки, чтобы он не забивал контекст.
 * Команда уже выполнилась как есть (код возврата и права не меняются); хук меняет только то,
 * что видит Claude (`updatedToolOutput`). Полный вывод берётся из `persistedOutputPath` (Bash сам
 * сохраняет туда длинный вывод), иначе сохраняется во временный файл.
 *
 * Срабатывает: pytest / vitest / npm run test:unit|build|check:guardrails, если вывод > LIMIT символов.
 * Отключить для одной команды: добавить в неё `CLAUDE_FULL_OUTPUT=1`.
 */
import { readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

const LIMIT = 6000;
const MAX_MATCH_LINES = 150;
const TAIL_LINES = 20;
const RUNNER = /\bpytest\b|\bvitest\b|npm(?:\.cmd)?\s+run\s+(?:test:unit|build|check:guardrails)\b/;
const SIGNAL = /FAILED|ERROR|Error\b|error:|Traceback|AssertionError|\bassert\b|✖|✗|not ok|\bfailed\b|\bpassed\b|\bcollected\b|warning:/;

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function trim(text) {
  const lines = text.split(/\r?\n/);
  const keep = new Set();
  lines.forEach((line, i) => {
    if (SIGNAL.test(line)) for (let k = i; k <= Math.min(i + 3, lines.length - 1); k++) keep.add(k);
  });
  const picked = [...keep].sort((a, b) => a - b).slice(0, MAX_MATCH_LINES);
  const out = [];
  let prev = -2;
  for (const i of picked) {
    if (i !== prev + 1) out.push('…');
    out.push(lines[i]);
    prev = i;
  }
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const tail = lines.slice(-TAIL_LINES);
  return { body: out.join('\n'), tail: tail.join('\n'), total: lines.length };
}

/** Полный вывод: Bash кладёт в stdout только начало (~30 000 символов), остальное — в persistedOutputPath. */
function fullOutput(res) {
  const p = typeof res.persistedOutputPath === 'string' ? res.persistedOutputPath : '';
  if (p) {
    try {
      return { text: readFileSync(p, 'utf8'), file: p };
    } catch {
      // файл недоступен — работаем с тем, что пришло в stdout
    }
  }
  return { text: `${String(res.stdout || '')}\n${String(res.stderr || '')}`, file: '' };
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    return;
  }
  const cmd = String(input?.tool_input?.command || '');
  const res = input?.tool_response;
  if (!res || typeof res !== 'object' || !RUNNER.test(cmd) || cmd.includes('CLAUDE_FULL_OUTPUT=1')) return;
  const { text, file } = fullOutput(res);
  if (text.length <= LIMIT) return;

  let full = file;
  if (!full) {
    full = path.join(os.tmpdir(), `claude-test-output-${Date.now()}.log`);
    try {
      writeFileSync(full, `$ ${cmd}\n\n${text}`);
    } catch {
      return; // не смогли сохранить полный вывод — не режем
    }
  }
  const t = trim(text);
  const summary =
    `[вывод сокращён хуком trim-test-output: ${t.total} строк → сигнальные строки + хвост; ` +
    `полный вывод: ${full}]\n\n${t.body}\n\n--- последние ${TAIL_LINES} строк ---\n${t.tail}`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        updatedToolOutput: {
          stdout: summary,
          stderr: '',
          interrupted: Boolean(res.interrupted),
          isImage: false,
        },
      },
    }),
  );
}

main();
