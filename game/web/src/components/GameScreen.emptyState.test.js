import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'GameScreen.jsx'), 'utf8');

assert.equal(
  /<Button[\s>]/.test(src),
  false,
  'GameScreen empty/error states must not use undeclared telegram-ui Button',
);
assert.match(src, /title="Пустой ответ"/);
assert.match(src, /MqxStateError/);
assert.match(src, /retryLabel="Обновить"/);

console.log('GameScreen.emptyState.test.js OK');
