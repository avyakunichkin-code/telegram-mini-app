/**
 * Наполнение подушки относительно цели (×3 обязательств / win_target_safety_fund).
 */

/** @returns {number|null} 0–100 или null, если цель не задана */
export function getSafetyFundFillPercent(balance, target) {
  const goal = Number(target) || 0;
  if (goal <= 0) return null;
  const current = Math.max(0, Number(balance) || 0);
  return Math.min(100, Math.round((current / goal) * 100));
}

/** @typedef {'low' | 'mid-low' | 'mid-high' | 'high'} SafetyFundFillTier */

/**
 * @param {number|null|undefined} percent
 * @returns {SafetyFundFillTier|null}
 */
export function getSafetyFundFillTier(percent) {
  if (percent == null || !Number.isFinite(percent)) return null;
  const p = Number(percent);
  if (p >= 75) return 'high';
  if (p >= 50) return 'mid-high';
  if (p >= 25) return 'mid-low';
  return 'low';
}

/**
 * @param {{ safety_fund_balance?: number, win_target_safety_fund?: number }} overview
 * @returns {{ percent: number, tier: SafetyFundFillTier } | null}
 */
export function getSafetyFundFillFromOverview(overview) {
  const percent = getSafetyFundFillPercent(
    overview?.safety_fund_balance,
    overview?.win_target_safety_fund,
  );
  if (percent == null) return null;
  const tier = getSafetyFundFillTier(percent);
  if (!tier) return null;
  return { percent, tier };
}
