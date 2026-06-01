import assert from 'node:assert/strict';

import { suggestSafetyFundAmount } from './safetyFundAmount.js';

assert.equal(suggestSafetyFundAmount(0), 0);
assert.equal(suggestSafetyFundAmount(400), 400);
assert.equal(suggestSafetyFundAmount(12_000), 3_000);
assert.equal(suggestSafetyFundAmount(100_000), 25_000);

console.log('safetyFundAmount.test.js OK');
