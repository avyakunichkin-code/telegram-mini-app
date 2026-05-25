import assert from 'node:assert/strict';
import {
  getSafetyFundFillPercent,
  getSafetyFundFillTier,
  getSafetyFundFillFromOverview,
  resolveSafetyFundTarget,
} from './safetyFundFill.js';

assert.equal(getSafetyFundFillPercent(0, 0), null);
assert.equal(getSafetyFundFillPercent(13500, 54000), 25);
assert.equal(getSafetyFundFillPercent(81000, 54000), 100);

assert.equal(getSafetyFundFillTier(12), 'low');
assert.equal(getSafetyFundFillTier(25), 'mid-low');
assert.equal(getSafetyFundFillTier(50), 'mid-high');
assert.equal(getSafetyFundFillTier(75), 'high');

const fill = getSafetyFundFillFromOverview({
  safety_fund_balance: 27000,
  win_target_safety_fund: 54000,
});
assert.deepEqual(fill, { percent: 50, tier: 'mid-high', target: 54000 });

assert.equal(resolveSafetyFundTarget({ win_target_safety_fund: 0, total_monthly_obligations: 18000 }), 54000);
const fillFallback = getSafetyFundFillFromOverview({
  safety_fund_balance: 27000,
  win_target_safety_fund: 0,
  total_monthly_obligations: 18000,
});
assert.deepEqual(fillFallback, { percent: 50, tier: 'mid-high', target: 54000 });

console.log('safetyFundFill.test.js OK');
