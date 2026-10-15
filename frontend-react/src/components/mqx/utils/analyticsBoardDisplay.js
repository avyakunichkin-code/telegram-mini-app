/** Аналитика ★ BG-2 «настольная игра»: вывод → из чего он (без React). Канон: design-lab/analytics/APPROVED.md. */

import { getMonthlyBurn } from '../../../utils/expensesDisplay.js';
import {
  ANALYTICS_THRESHOLDS,
  computeCushionMonths as cushionVsPressure,
  computeLiquidity,
  computeMonthlyResidual,
} from '../../../utils/analyticsDisplay.js';
import { pluralRu } from './boardDashDisplay.js';

/** «без ограничения» для подушки/счёта, когда расходов нет. */
const UNLIMITED = 99;

const num = (v) => Number(v) || 0;

/** 1 → «1», 1.94 → «1,9»; ∞ → «—». */
export function formatTurns(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v >= UNLIMITED) return '—';
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}

/** «1 ход», «3 хода», «1,5 хода», «5 ходов». */
export function turnsPhrase(n) {
  const r = Math.round(Number(n) * 10) / 10;
  if (!Number.isInteger(r)) return `${formatTurns(r)} хода`;
  return `${r} ${pluralRu(r, 'ход', 'хода', 'ходов')}`;
}

/** Подзаголовок шапки: «Как ты стоишь на 12-м ходу». */
export function analyticsHeadCaption(periodIndex) {
  const n = Math.trunc(Number(periodIndex));
  return Number.isFinite(n) && n > 0 ? `Как ты стоишь на ${n}-м ходу` : 'Как ты стоишь сейчас';
}

const hasSpending = (overview) => num(overview?.total_monthly_outflow) > 0;

/** На сколько ходов хватит подушки; без трат за ход — «без ограничения». */
export function computeCushionTurns(overview) {
  return hasSpending(overview) ? cushionVsPressure(overview) : UNLIMITED;
}

/** На сколько ходов хватит счёта при текущих тратах за ход; без трат — «без ограничения». */
export function computeCashTurns(overview) {
  if (!hasSpending(overview)) return UNLIMITED;
  return Math.max(0, num(overview?.cash_balance) / num(overview.total_monthly_outflow));
}

/**
 * Пилюля риска — главная причина или null. Та же база, что у красных показателей
 * и красного совета Монетки: пилюля горит ⇔ на экране есть красное число или минус.
 */
export function resolveRiskLabel(overview) {
  const dti = num(overview?.liabilities_to_income_ratio);
  const cushion = computeCushionTurns(overview);
  if (dti >= ANALYTICS_THRESHOLDS.dtiCriticalPct) return 'Долги давят';
  if (computeMonthlyResidual(overview) < 0) return 'Траты больше дохода';
  if (hasSpending(overview) && num(overview?.safety_fund_balance) <= 0) return 'Подушки нет';
  if (cushion < ANALYTICS_THRESHOLDS.cushionMonthsMin) return 'Подушка тонкая';
  if (dti >= ANALYTICS_THRESHOLDS.dtiAttentionPct && num(overview?.total_monthly_income) > 0) return 'Много долгов';
  if (computeCashTurns(overview) < ANALYTICS_THRESHOLDS.runwayCriticalMonths) return 'Счёт на исходе';
  return null;
}

/** Карточка-вывод «Счёт и подушка». */
export function buildStateCard(overview) {
  const target = ANALYTICS_THRESHOLDS.cushionMonthsMin;
  const cushion = computeCushionTurns(overview);
  let note;
  if (hasSpending(overview) && num(overview?.safety_fund_balance) <= 0) {
    note = `Подушки пока нет. Ориентир — ${turnsPhrase(target)} расходов.`;
  } else if (cushion >= UNLIMITED) {
    note = 'Трат за ход нет — подушка не расходуется.';
  } else if (cushion < target) {
    note = `Подушки хватит на ${turnsPhrase(cushion)} расходов. Ориентир — ${turnsPhrase(target)}.`;
  } else {
    note = `Подушки хватит на ${turnsPhrase(cushion)} расходов — запас в норме.`;
  }
  return {
    liquidity: computeLiquidity(overview),
    risk: resolveRiskLabel(overview),
    note,
  };
}

/**
 * «Куда уходит доход»: доли от большего из дохода и трат.
 * @returns {{ income: number, total: number, empty: boolean, segments: Array<{ key: string, label: string, amount: number, tone: string, share: number }> }}
 */
export function buildIncomeSplit(overview) {
  const income = num(overview?.total_monthly_income);
  const life = getMonthlyBurn(overview);
  const debt = num(overview?.total_monthly_liabilities_payment);
  const upkeep = num(overview?.total_monthly_assets_maintenance);
  const spent = life + debt + upkeep;
  const rest = income - spent;
  const total = Math.max(income, spent);

  const parts = [
    { key: 'life', label: 'Расходы на жизнь', amount: -life, tone: 'life' },
    { key: 'debt', label: 'Платежи по долгам', amount: -debt, tone: 'risk' },
    { key: 'upkeep', label: 'Содержание имущества', amount: -upkeep, tone: 'upkeep' },
    rest >= 0
      ? { key: 'rest', label: 'Остаётся тебе', amount: rest, tone: 'gain' }
      : { key: 'short', label: 'Не хватает', amount: rest, tone: 'short' },
  ].filter((p) => Math.round(Math.abs(p.amount)) > 0);

  return {
    income,
    total,
    empty: total <= 0,
    segments: parts.map((p) => ({
      ...p,
      // «Не хватает» не занимает места в полосе: полоса = траты, доход меньше.
      share: p.key === 'short' || total <= 0 ? 0 : Math.abs(p.amount) / total,
    })),
  };
}

/** Три показателя устойчивости простыми словами. */
export function buildStabilityMetrics(overview) {
  const income = num(overview?.total_monthly_income);
  const dti = num(overview?.liabilities_to_income_ratio);
  const cushion = computeCushionTurns(overview);
  const cashTurns = computeCashTurns(overview);
  return [
    {
      key: 'cushion',
      value: formatTurns(cushion),
      label: cushion >= UNLIMITED ? 'подушка, трат нет' : 'подушка, ходов расходов',
      risk: cushion < ANALYTICS_THRESHOLDS.cushionMonthsMin,
    },
    {
      key: 'cash',
      value: formatTurns(cashTurns),
      label: cashTurns >= UNLIMITED ? 'счёт, трат нет' : 'хода продержится счёт',
      risk: cashTurns < ANALYTICS_THRESHOLDS.runwayCriticalMonths,
    },
    {
      key: 'debt',
      value: income > 0 ? `${Math.round(dti)}%` : '—',
      label: 'дохода на долги',
      risk: income > 0 && dti >= ANALYTICS_THRESHOLDS.dtiAttentionPct,
    },
  ];
}

/** Δ ликвидности за ход для прогноза: факт по закрытым ходам, иначе модель хода. */
export function resolveForecastDelta(overview) {
  if (num(overview?.avg_net_cashflow_6p_n) > 0) return num(overview?.avg_net_cashflow_6p);
  return computeMonthlyResidual(overview);
}

const HISTORY_MAX = 12;

/**
 * Геометрия графика «счёт + подушка»: история (сплошная) → «сейчас» → прогноз (пунктир).
 * points — ответ /finance/analytics/timeseries (последняя точка с is_projection — текущий снимок).
 */
export function buildForecastChart({ points, liquidityNow, delta, horizon = 3, width = 300, height = 110 }) {
  const closed = (points ?? []).filter((p) => !p?.is_projection).slice(-HISTORY_MAX);
  const now = Number(liquidityNow) || 0;
  const step = Number(delta) || 0;
  const history = [...closed.map((p) => num(p.cash_balance) + num(p.safety_fund_balance)), now];
  const forecast = Array.from({ length: horizon + 1 }, (_, i) => now + i * step);

  const padL = 6;
  const padR = 6;
  const top = 18;
  const bottom = height - 10;
  const all = [...history, ...forecast];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min;
  const slots = history.length - 1 + horizon;
  const dx = (width - padL - padR) / Math.max(slots, 1);
  const x = (i) => padL + i * dx;
  const y = (v) => (span <= 0 ? (top + bottom) / 2 : bottom - ((v - min) / span) * (bottom - top));
  const pt = (i, v) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`;

  const nowIndex = history.length - 1;
  return {
    width,
    height,
    baseY: bottom,
    midY: (top + bottom) / 2,
    closedCount: closed.length,
    historyPoints: history.length > 1 ? history.map((v, i) => pt(i, v)).join(' ') : '',
    forecastPoints: forecast.map((v, i) => pt(nowIndex + i, v)).join(' '),
    now: { x: x(nowIndex), y: y(now), value: now },
    end: { x: x(nowIndex + horizon), y: y(forecast[horizon]), value: forecast[horizon] },
    first: history[0],
    horizon,
  };
}

/**
 * Совет Монетки одной строкой: сначала риск, потом шаг цели, потом ориентир подушки.
 * @returns {{ text: string, tone: 'risk' | 'normal' }}
 */
export function buildAnalyticsTip(overview, goalView = null) {
  const dti = num(overview?.liabilities_to_income_ratio);
  if (dti >= ANALYTICS_THRESHOLDS.dtiCriticalPct) {
    return { text: `Долги съедают ${Math.round(dti)}% дохода — не бери новые`, tone: 'risk' };
  }
  if (computeMonthlyResidual(overview) < 0) {
    return { text: 'Траты больше дохода — урежь расходы на жизнь', tone: 'risk' };
  }
  if (computeCushionTurns(overview) < 1) {
    return { text: 'Отложи в подушку хотя бы один ход расходов', tone: 'normal' };
  }
  if (goalView?.phase === 'active' && goalView.currentGoal?.title) {
    return { text: `Следующий шаг цели — ${goalView.currentGoal.title}`, tone: 'normal' };
  }
  if (computeCushionTurns(overview) < ANALYTICS_THRESHOLDS.cushionMonthsMin) {
    return { text: `Дорасти подушку до ${turnsPhrase(ANALYTICS_THRESHOLDS.cushionMonthsMin)} расходов`, tone: 'normal' };
  }
  return { text: 'Всё устойчиво — так держать', tone: 'normal' };
}
