import { resolveMonthlyPressureForBaseline } from './safetyFundFill';

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

const ZONE_LABELS = {
  ok: 'Комфортная зона',
  warn: 'Зона внимания',
  crit: 'Критично',
};

export function stabilityZoneLabel(zone) {
  return ZONE_LABELS[zone] ?? ZONE_LABELS.warn;
}

export function resolveForecastMonthlyDelta(overview) {
  const n = Number(overview?.avg_net_cashflow_6p_n) || 0;
  if (n > 0) return Number(overview?.avg_net_cashflow_6p) || 0;
  return Number(overview?.net_monthly_cashflow) || 0;
}

export function liquidityFromPoint(point) {
  return (Number(point?.cash_balance) || 0) + (Number(point?.safety_fund_balance) || 0);
}

/** Главная рекомендация v1 (до BE insights). */
export function buildPrimaryInsight(overview) {
  const dti = Number(overview?.liabilities_to_income_ratio) || 0;
  if (dti >= ANALYTICS_THRESHOLDS.dtiCriticalPct) {
    return {
      title: `Платежи по долгам — ${dti.toFixed(0)}% дохода`,
      body: 'Это выше комфортной зоны. Стоит пересмотреть нагрузку по обязательствам в ближайших ходах.',
    };
  }
  if (dti >= ANALYTICS_THRESHOLDS.dtiAttentionPct) {
    return {
      title: `Платежи по долгам — ${dti.toFixed(0)}% дохода`,
      body: 'Это верхняя граница комфортной зоны. Имеет смысл смотреть, можно ли снизить нагрузку в следующих ходах.',
    };
  }

  const residual = computeMonthlyResidual(overview);
  if (residual < 0) {
    return {
      title: 'После всех расходов остаётся минус',
      body: 'При текущей модели месяца расходы превышают доход. Проверьте обязательства и траты на жизнь.',
    };
  }

  const cushionMonths = computeCushionMonths(overview);
  if (cushionMonths < ANALYTICS_THRESHOLDS.cushionMonthsMin) {
    return {
      title: `Подушка — ${cushionMonths.toFixed(1).replace('.', ',')} мес. давления`,
      body: 'Запас ниже ориентира в 3 месяца. Имеет смысл наращивать подушку, пока давление на бюджет не выросло.',
    };
  }

  return {
    title: 'Финансовая модель месяца сбалансирована',
    body: 'Показатели в комфортной зоне. Следите за динамикой на графиках после закрытия ходов.',
  };
}
