import assert from 'node:assert/strict';

import { shouldAttachIdempotencyKey } from './idempotencyKey.js';

assert.equal(
  shouldAttachIdempotencyKey('POST', '/api/game/period/contribute-to-safety-fund'),
  true,
);
assert.equal(
  shouldAttachIdempotencyKey('POST', '/api/game/period/withdraw-from-safety-fund'),
  true,
);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/game/period/treat-self'), true);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/invest/deposit/open'), true);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/invest/bond/buy'), true);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/insurance/buy'), true);

assert.equal(shouldAttachIdempotencyKey('POST', '/api/game/period/claim-salary'), false);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/game/time/next'), false);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/game/events/42/choose'), false);
assert.equal(shouldAttachIdempotencyKey('GET', '/api/finance/overview'), false);
assert.equal(shouldAttachIdempotencyKey('POST', '/api/game/profiles'), false);

console.log('idempotencyKey.test.js OK');
