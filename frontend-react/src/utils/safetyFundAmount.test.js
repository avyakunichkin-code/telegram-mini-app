import assert from 'node:assert/strict';

import { safetyFundAmountPresets, suggestSafetyFundAmount } from './safetyFundAmount.js';

assert.equal(suggestSafetyFundAmount(0), 0);
assert.equal(suggestSafetyFundAmount(400), 400);
assert.equal(suggestSafetyFundAmount(12_000), 3_000);

const presets = safetyFundAmountPresets(10_000);
assert.deepEqual(
  presets.map((p) => p.label),
  ['25%', '50%', 'Всё'],
);
assert.equal(presets[2].value, 10_000);

const tiny = safetyFundAmountPresets(300);
assert.equal(tiny.length, 3);
assert.equal(tiny[2].value, 300);

console.log('safetyFundAmount.test.js OK');
