#!/usr/bin/env node
/** @deprecated Prefer `node _maintain.mjs patch-last-context` — see README.md */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const catalogPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../catalog.yaml',
);

const tiered = new Set([
  'api-and-interface-design',
  'code-review-and-quality',
  'create-event',
  'event-analysis',
  'design-lab-mqx',
  'frontend-ui-engineering',
  'game-economy-and-victory',
  'incremental-implementation',
  'planning-and-task-breakdown',
  'spec-driven-development',
  'db-baselines-and-migrations',
]);

let text = fs.readFileSync(catalogPath, 'utf8');

for (const name of tiered) {
  const blockRe = new RegExp(
    `(^  ${name}:[\\s\\S]*?)(    last_context: )"[^"]*"(\\r?\\n    last_context_result: )[^\\r\\n]*`,
    'm',
  );
  if (!blockRe.test(text)) {
    console.warn(`skip (no last_context): ${name}`);
    continue;
  }
  text = text.replace(
    blockRe,
    `$1$2"2026-06-20"$3COMPLIANT`,
  );
}

text = text.replace(
  /(^  db-baselines-and-migrations:[\s\S]*?    last_static: )"[^"]*"\r?\n    last_static_result: [^\r\n]*/m,
  '$1"2026-06-20"\n    last_static_result: COMPLIANT',
);

fs.writeFileSync(catalogPath, text);
console.log(`Updated last_context for ${tiered.size} skills`);
