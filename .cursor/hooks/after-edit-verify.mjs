#!/usr/bin/env node
/**
 * Post-edit reminders for ТВОЙ ХОД (economy, MQX prod, design-lab).
 * stdin: Cursor afterFileEdit JSON { file_path | path | ... }
 * stdout: { "additional_context": "..." } or {}
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

const raw = readStdin();
let payload = {};
if (raw.trim()) {
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }
}

const filePath = normalize(
  payload.file_path ?? payload.path ?? payload.filePath ?? '',
);

const hints = [];

const balancePlaytestHint =
  'После существенных правок: `/balance-playtest` или `cd backend && python scripts/balance_playtest.py` (diff vs docs/balance/baselines/). Subagent: `economy-balance-runner`.';

if (/data\/events\/mvp11\//.test(filePath)) {
  hints.push(
    `ТВОЙ ХОД hook: YAML событий — \`/create-event\`; pytest: \`cd backend && python -m pytest -q -k event\`. ${balancePlaytestHint}`,
  );
} else if (/backend\/app\/events\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: каталог событий — skill `/create-event`; brief: docs/templates/EVENT_BRIEF.md; после правок: `cd backend && python -m pytest -q -k event`.',
  );
  hints.push(balancePlaytestHint);
} else if (/backend\/app\/(game|victory)\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: экономика/победа — `game-economy-and-victory`; satellites: `test-driven-development`, `critical-test-scenarios`, `doubt-driven-development`; `cd backend && python -m pytest -q`.',
  );
  hints.push(balancePlaytestHint);
} else if (/backend\/app\/routers\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: API — skill `/critical-tests` (gate G3): минимум integration test на контракт JSON; satellite `test-driven-development`.',
  );
} else if (/backend\/app\/seeds\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: seeds/шаблоны — проверь victory_config_json и starter templates; pytest + balance playtest.',
  );
  hints.push(balancePlaytestHint);
}

if (/backend\/tests\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: тесты — `backend/tests/README.md`; skill `/critical-tests`. Запуск: `cd backend && python -m pytest -q`.',
  );
}

if (/frontend-react\/src\/.*__tests__\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: FE contract tests — `cd frontend-react && npm run test:unit`. Skill: `/critical-tests`.',
  );
}

if (/docs\/specs\/features\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: spec — § Critical scenarios (CS-*) до кода; skill `/critical-tests`.',
  );
}

if (/backend\/migrations\//.test(filePath) && /\.sql$/.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: SQL-миграция — проверь `backend/migrations/README.md`, `migrate.ps1`, согласование с `models.py` и ADR.',
  );
}

if (
  /frontend-react\/src\/components\/(mqx\/|.*Premium\.jsx)/.test(filePath) ||
  /frontend-react\/src\/components\/mqx\//.test(filePath)
) {
  hints.push(
    'ТВОЙ ХОД hook: MQX/prod UI — DESIGN_WORKFLOW; новый визуал — design-lab. Контракт display/helpers — `/critical-tests`. PR: `npm run check:guardrails`.',
  );
}

if (/design-lab\/nav\.manifest\.json$/.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: nav.manifest — пересобери хаб: `cd frontend-react && npm run design-lab:build-nav`. Полный parity: `npm run design-lab:build`. См. `docs/agents/DESIGN_LAB_NAVIGATION.md`.',
  );
} else if (
  /design-lab\/[^/]+\/canon\.manifest\.json$/.test(filePath) ||
  /design-lab\/dashboard\/canon\.manifest\.json$/.test(filePath) ||
  /design-lab\/finance\/canon\.manifest\.json$/.test(filePath)
) {
  hints.push(
    'ТВОЙ ХОД hook: canon.manifest — `cd frontend-react && npm run design-lab:build` (page parity). См. `docs/agents/DESIGN_LAB_NAVIGATION.md`.',
  );
} else if (/design-lab\//.test(filePath) && /\/(index\.html|styles\.css|lab-base\.css)$/.test(filePath)) {
  const isRoundHtml = /\/[^/]+-round\/index\.html$/.test(filePath) || /parity-generated-page-round\/blocks\//.test(filePath);
  hints.push(
    'ТВОЙ ХОД hook: design-lab round — index.html только `./lab-base.css` (без `../`). После styles.css: `./sync-lab.sh` (bash) или `.\\sync-lab.ps1` (не `./sync-lab.ps1` в bash). Проверка: `cd frontend-react && npm run design-lab:check-rounds`.',
  );
  if (isRoundHtml) {
    hints.push(
      'ТВОЙ ХОД hook: новый round — пункт в `design-lab/nav.manifest.json`, затем `npm run design-lab:build-nav`. Ревью: `cd design-lab && npx serve .` (хаб), не serve только в подпапке без build.',
    );
  }
}

if (hints.length === 0) {
  process.stdout.write('{}');
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    additional_context: hints.join('\n\n'),
  }),
);
process.exit(0);
