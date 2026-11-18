import assert from 'node:assert/strict';
import { bootstrapErrorAction } from './bootstrapErrorAction.js';

// Старый plan-профиль (410) — в меню, не «Повторить загрузку» по кругу.
assert.equal(bootstrapErrorAction(410), 'menu');
// Сеть, 5xx, 404 и неизвестный статус — прежний экран ошибки с повтором.
for (const status of [undefined, null, 0, 404, 500, 503]) {
  assert.equal(bootstrapErrorAction(status), 'retry');
}
