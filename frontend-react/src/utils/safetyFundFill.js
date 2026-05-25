/**
 * Индикатор подушки — базовая норма финансовой безопасности, не цели сценария.
 * Норма пересчитывается из текущих обязательств (по умолчанию ×3).
 */

export const SAFETY_FUND_BASELINE_MULTIPLIER = 3;

/**
 * Рекомендуемый объём подушки по текущим финансам (не victory / win_target).
 * @param {{ total_monthly_obligations?: number, safety_fund_baseline_target?: number }} overview
 */
export function resolveSafetyFundBaselineTarget(overview) {
  const fromApi = Number(overview?.safety_fund_baseline_target);
  if (Number.isFinite(fromApi) && fromApi > 0) return fromApi;

  const obligations = Number(overview?.total_monthly_obligations) || 0;
  if (obligations <= 0) return null;
  return obligations * SAFETY_FUND_BASELINE_MULTIPLIER;
}

/** @deprecated используй resolveSafetyFundBaselineTarget */
export const resolveSafetyFundTarget = resolveSafetyFundBaselineTarget;

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
 * @param {{ safety_fund_balance?: number, total_monthly_obligations?: number, safety_fund_baseline_target?: number }} overview
 * @returns {{ percent: number, tier: SafetyFundFillTier, target: number } | null}
 */
export function getSafetyFundFillFromOverview(overview) {
  const target = resolveSafetyFundBaselineTarget(overview);
  if (target == null) return null;
  const percent = getSafetyFundFillPercent(overview?.safety_fund_balance, target);
  if (percent == null) return null;
  const tier = getSafetyFundFillTier(percent);
  if (!tier) return null;
  return { percent, tier, target };
}
