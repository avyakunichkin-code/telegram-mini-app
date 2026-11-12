import assert from 'node:assert/strict';
import { createNetworkStatus, isNetworkFailure } from './networkStatus.js';

// Переходы офлайн ↔ онлайн уведомляют подписчиков один раз на смену состояния.
{
  const status = createNetworkStatus(true);
  const seen = [];
  const unsubscribe = status.subscribe((offline) => seen.push(offline));
  status.markOk();
  status.markFailure();
  status.markFailure();
  assert.equal(status.isOffline(), true);
  status.markOk();
  assert.deepEqual(seen, [true, false]);
  unsubscribe();
  status.markFailure();
  assert.deepEqual(seen, [true, false]);
}

// navigator.onLine === false на старте — сразу офлайн.
assert.equal(createNetworkStatus(false).isOffline(), true);

// Сетевой сбой fetch — TypeError; HTTP-ошибки и прочее — нет.
assert.equal(isNetworkFailure(new TypeError('Failed to fetch')), true);
assert.equal(isNetworkFailure(new Error('boom')), false);

console.log('networkStatus: ok');
