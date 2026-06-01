import assert from 'node:assert/strict';
import {
  formatSafetyFundChipTitle,
  getSafetyFundFillPercent,
  getSafetyFundFillTier,
  getSafetyFundFillFromOverview,
  resolveSafetyFundBaselineTarget,
  resolveMonthlyPressureForBaseline,
  SAFETY_FUND_CHIP_LABEL,
} from './safetyFundFill.js';

assert.equal(SAFETY_FUND_CHIP_LABEL, 'ФИН.ПОДУШКА');
assert.equal(formatSafetyFundChipTitle(null), 'ФИН.ПОДУШКА');
assert.equal(formatSafetyFundChipTitle(35), 'ФИН.ПОДУШКА · 35%');

assert.equal(getSafetyFundFillPercent(0, 0), null);
assert.equal(getSafetyFundFillPercent(13500, 54000), 25);
assert.equal(getSafetyFundFillPercent(81000, 54000), 100);

assert.equal(getSafetyFundFillTier(12), 'low');
assert.equal(getSafetyFundFillTier(25), 'mid-low');
assert.equal(getSafetyFundFillTier(50), 'mid-high');
assert.equal(getSafetyFundFillTier(75), 'high');

assert.equal(resolveMonthlyPressureForBaseline({ total_monthly_outflow: 32000 }), 32000);
assert.equal(
  resolveMonthlyPressureForBaseline({ total_monthly_obligations: 12000, monthly_burn_total: 8000 }),
  20000,
);

const fill = getSafetyFundFillFromOverview({
  safety_fund_balance: 30000,
  total_monthly_outflow: 20000,
});
assert.deepEqual(fill, { percent: 50, tier: 'mid-high', target: 60000 });

assert.equal(
  resolveSafetyFundBaselineTarget({ safety_fund_baseline_target: 60000, total_monthly_outflow: 10000 }),
  60000,
);
assert.equal(
  resolveSafetyFundBaselineTarget({ total_monthly_obligations: 10000, monthly_burn_total: 8000 }),
  54000,
);
assert.equal(
  resolveSafetyFundBaselineTarget({ win_target_safety_fund: 99999, total_monthly_outflow: 18000 }),
  54000,
);

const fillParts = getSafetyFundFillFromOverview({
  safety_fund_balance: 15000,
  total_monthly_obligations: 5000,
  monthly_burn_total: 10000,
});
assert.deepEqual(fillParts, { percent: 33, tier: 'mid-low', target: 45000 });

console.log('safetyFundFill.test.js OK');
