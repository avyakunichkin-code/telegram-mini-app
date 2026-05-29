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
    'ТВОЙ ХОД hook: экономика/победа — `test-driven-development` + `doubt-driven-development`; `cd backend && python -m pytest -q`. Primary: `game-economy-and-victory`.',
  );
  hints.push(balancePlaytestHint);
} else if (/backend\/app\/seeds\//.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: seeds/шаблоны — проверь victory_config_json и starter templates; pytest + balance playtest.',
  );
  hints.push(balancePlaytestHint);
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
    'ТВОЙ ХОД hook: MQX/prod UI — следуй DESIGN_WORKFLOW; если визуал новый — сначала design-lab. Перед PR: `cd frontend-react && npm run check:guardrails`.',
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
} else if (/design-lab\/[^/]+\/[^/]+\/index\.html$/.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: новый/изменённый round — добавь ссылку в `design-lab/nav.manifest.json`, затем `npm run design-lab:build-nav`. Ревью через хаб `cd design-lab && npx serve .`, не только serve в round.',
  );
} else if (/design-lab\//.test(filePath) && /styles\.css$/.test(filePath)) {
  hints.push(
    'ТВОЙ ХОД hook: правка styles в design-lab — `sync-lab.ps1` в раунде; только `./` в index.html. Обзор: хаб `design-lab/` + `DESIGN_LAB_NAVIGATION.md`.',
  );
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
