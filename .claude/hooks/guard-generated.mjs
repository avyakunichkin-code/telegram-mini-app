#!/usr/bin/env node
/**
 * PreToolUse (Edit|Write|MultiEdit) — гейт ТВОЙ ХОД: запрет ручных правок сгенерированных файлов.
 *   - design-lab/index.html            ← `npm run design-lab:build-nav` (из nav.manifest.json)
 *   - design-lab/**\/lab-base.css      ← `./sync-lab.sh` / `npm run design-lab:sync-round`
 *   - backend/migrations/0000_schema_baseline.sql — только DDL: DML (INSERT/UPDATE/DELETE) блокируется
 * Правила: .claude/rules/design-lab.md, .claude/rules/db-migrations.md.
 * Вход: stdin JSON Claude Code (`tool_input.file_path`, `content` | `new_string` | `edits[].new_string`).
 * Выход: exit 2 + причина в stderr → вызов инструмента блокируется; иначе exit 0 без вывода.
 * Self-test: node .claude/hooks/guards.test.mjs
 */
import { readFileSync } from 'fs';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function normalize(p) {
  return String(p || '').replace(/\\/g, '/');
}

/** Same rule as validate_baseline.sh: statement at line start (or after `;`), comments ignored. */
const DML_RE = /(?:^|;)[ \t]*(INSERT|UPDATE|DELETE)\s+/im;

function findDml(text) {
  const code = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
  return code.match(DML_RE)?.[1]?.toUpperCase() ?? null;
}

export function checkToolInput(toolInput = {}) {
  const filePath = normalize(toolInput.file_path);
  if (!filePath) return null;

  if (/(?:^|\/)design-lab\/index\.html$/.test(filePath)) {
    return (
      'ТВОЙ ХОД guard: design-lab/index.html генерируется из design-lab/nav.manifest.json — ручная правка запрещена.\n' +
      'Правь nav.manifest.json, затем: cd frontend-react && npm run design-lab:build-nav. См. .claude/rules/design-lab.md.'
    );
  }

  if (/(?:^|\/)design-lab\/(?:.+\/)?lab-base\.css$/.test(filePath)) {
    return (
      'ТВОЙ ХОД guard: lab-base.css в раунде design-lab генерируется — ручная правка запрещена.\n' +
      'Правь родительские стили / styles.css раунда, затем ./sync-lab.sh в раунде ' +
      'или cd frontend-react && npm run design-lab:sync-round -- design-lab/<тема>/<round>. См. .claude/rules/design-lab.md.'
    );
  }

  if (/(?:^|\/)backend\/migrations\/0000_schema_baseline\.sql$/.test(filePath)) {
    const fragments = [toolInput.content, toolInput.new_string, ...(toolInput.edits ?? []).map((e) => e?.new_string)];
    for (const fragment of fragments) {
      const verb = findDml(fragment);
      if (verb) {
        return (
          `ТВОЙ ХОД guard: ${verb} в backend/migrations/0000_schema_baseline.sql — baseline только DDL.\n` +
          'Данные — в backend/app/seeds/ (seed_all), backfill — в инкрементной миграции 00NN_*.sql (идемпотентно, с WHERE). ' +
          'См. .claude/rules/db-migrations.md и skill db-baselines-and-migrations.'
        );
      }
    }
  }

  return null;
}

const isMain = normalize(process.argv[1]).endsWith('/guard-generated.mjs');
if (isMain) {
  const raw = readStdin();
  let payload = {};
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.exit(0); // malformed input — do not block
  }
  const reason = checkToolInput(payload.tool_input ?? {});
  if (reason) {
    process.stderr.write(`${reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}
