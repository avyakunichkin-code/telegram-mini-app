import { resolveMonthlyPressureForBaseline } from './safetyFundFill.js';

/** Дефолты из SPEC_ANALYTICS §3.1 (единые для Game и Plan). */
export const ANALYTICS_THRESHOLDS = {
  cushionMonthsComfort: 6,
  cushionMonthsMin: 3,
  dtiAttentionPct: 40,
  dtiCriticalPct: 50,
  runwayCriticalMonths: 1,
};

export function computeLiquidity(overview) {
  const cash = Number(overview?.cash_balance) || 0;
  const safety = Number(overview?.safety_fund_balance) || 0;
  return cash + safety;
}

export function computeMonthlyResidual(overview) {
  const income = Number(overview?.total_monthly_income) || 0;
  const outflow = Number(overview?.total_monthly_outflow) || 0;
  return income - outflow;
}

export function computeCushionMonths(overview) {
  const safety = Number(overview?.safety_fund_balance) || 0;
  const pressure = resolveMonthlyPressureForBaseline(overview);
  if (pressure <= 0) return safety > 0 ? 99 : 0;
  return safety / pressure;
}

export function computeRunwayPeriods(overview) {
  const cash = Number(overview?.cash_balance) || 0;
  const obligations = Number(overview?.total_monthly_obligations) || 0;
  if (obligations <= 0) return cash > 0 ? 99 : 0;
  return Math.floor(cash / obligations);
}

export function resolveStabilityZone(overview) {
  const dti = Number(overview?.liabilities_to_income_ratio) || 0;
  const cushionMonths = computeCushionMonths(overview);
  const residual = computeMonthlyResidual(overview);
  const runway = computeRunwayPeriods(overview);

  if (
    dti >= ANALYTICS_THRESHOLDS.dtiCriticalPct ||
    (residual < 0 && runway <= 0) ||
    cushionMonths < 1
  ) {
    return 'crit';
  }
  if (
    dti >= ANALYTICS_THRESHOLDS.dtiAttentionPct ||
    cushionMonths < ANALYTICS_THRESHOLDS.cushionMonthsMin ||
    runway <= ANALYTICS_THRESHOLDS.runwayCriticalMonths
  ) {
    return 'warn';
  }
  return 'ok';
}
