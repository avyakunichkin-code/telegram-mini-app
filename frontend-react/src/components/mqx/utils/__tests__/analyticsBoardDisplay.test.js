import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  analyticsHeadCaption,
  buildAnalyticsTip,
  buildForecastChart,
  buildIncomeSplit,
  buildStabilityMetrics,
  buildStateCard,
  formatTurns,
  resolveForecastDelta,
  turnsPhrase,
} from '../analyticsBoardDisplay.js';

/** Лабораторный пример ★ BG-2: 132 400 ₽, подушка ≈1 ход, долги 14%. */
const lab = {
  period_index: 12,
  cash_balance: 88_400,
  safety_fund_balance: 46_500,
  total_monthly_income: 65_400,
  monthly_burn_total: 37_500,
  total_monthly_liabilities_payment: 9_000,
  total_monthly_assets_maintenance: 0,
  total_monthly_obligations: 9_000,
  total_monthly_outflow: 46_500,
  liabilities_to_income_ratio: 13.8,
};

const calm = {
  ...lab,
  cash_balance: 200_000,
  safety_fund_balance: 200_000,
};

describe('BG-2 analytics display', () => {
  it('formats turns and phrases', () => {
    assert.equal(formatTurns(1), '1');
    assert.equal(formatTurns(1.94), '1,9');
    assert.equal(formatTurns(99), '—');
    assert.equal(turnsPhrase(1), '1 ход');
    assert.equal(turnsPhrase(3), '3 хода');
    assert.equal(turnsPhrase(5), '5 ходов');
    assert.equal(turnsPhrase(1.5), '1,5 хода');
    assert.equal(analyticsHeadCaption(12), 'Как ты стоишь на 12-м ходу');
    assert.equal(analyticsHeadCaption(undefined), 'Как ты стоишь сейчас');
  });

  it('shows the risk pill only when there is a real risk', () => {
    const risky = buildStateCard(lab);
    assert.equal(risky.liquidity, 134_900);
    assert.equal(risky.risk, 'Подушка тонкая');
    assert.match(risky.note, /^Подушки хватит на 1 ход расходов\. Ориентир — 3 хода\.$/);

    const ok = buildStateCard(calm);
    assert.equal(ok.risk, null);
    assert.match(ok.note, /запас в норме/);

    const start = buildStateCard({ ...lab, safety_fund_balance: 0 });
    assert.equal(start.risk, 'Подушки нет');
    assert.equal(start.note, 'Подушки пока нет. Ориентир — 3 хода расходов.');
  });

  it('keeps the screen calm when there is no spending yet', () => {
    const empty = { cash_balance: 0, safety_fund_balance: 0 };
    assert.equal(buildStateCard(empty).risk, null);
    assert.ok(buildStabilityMetrics(empty).every((m) => !m.risk));
    assert.notEqual(buildAnalyticsTip(empty).tone, 'risk');
    assert.doesNotMatch(buildAnalyticsTip(empty).text, /Отложи/);
  });

  it('lights the pill exactly when a metric is red', () => {
    const lowCash = { ...calm, cash_balance: 20_000 };
    assert.equal(buildStateCard(lowCash).risk, 'Счёт на исходе');
    assert.equal(buildStabilityMetrics(lowCash)[1].risk, true);
  });

  it('splits income into life, debt and the rest', () => {
    const split = buildIncomeSplit(lab);
    assert.equal(split.income, 65_400);
    assert.deepEqual(
      split.segments.map((s) => [s.key, s.amount]),
      [
        ['life', -37_500],
        ['debt', -9_000],
        ['rest', 18_900],
      ],
    );
    const shares = split.segments.reduce((a, s) => a + s.share, 0);
    assert.ok(Math.abs(shares - 1) < 1e-9);
  });

  it('marks a shortfall when spending exceeds income', () => {
    const split = buildIncomeSplit({ ...lab, total_monthly_income: 40_000 });
    const short = split.segments.find((s) => s.key === 'short');
    assert.equal(short.amount, -6_500);
    assert.equal(short.share, 0);
    assert.equal(split.total, 46_500);
  });

  it('reports an empty split when there is no money flow', () => {
    assert.equal(buildIncomeSplit({}).empty, true);
  });

  it('names stability metrics in plain words', () => {
    const [cushion, cash, debt] = buildStabilityMetrics(lab);
    assert.deepEqual([cushion.value, cushion.risk], ['1', true]);
    assert.deepEqual([cash.value, cash.label, cash.risk], ['1,9', 'хода продержится счёт', false]);
    assert.deepEqual([debt.value, debt.label, debt.risk], ['14%', 'дохода на долги', false]);
    const noIncome = buildStabilityMetrics({ ...lab, total_monthly_income: 0 })[2];
    assert.equal(noIncome.value, '—');
  });

  it('forecasts from actual closings, else from the turn model', () => {
    assert.equal(resolveForecastDelta({ ...lab, avg_net_cashflow_6p: 12_000, avg_net_cashflow_6p_n: 3 }), 12_000);
    assert.equal(resolveForecastDelta(lab), 18_900);
  });

  it('builds history + forecast geometry with a "now" mark', () => {
    const points = [
      { cash_balance: 10_000, safety_fund_balance: 0 },
      { cash_balance: 20_000, safety_fund_balance: 5_000 },
      { cash_balance: 30_000, safety_fund_balance: 0, is_projection: true },
    ];
    const g = buildForecastChart({ points, liquidityNow: 30_000, delta: 10_000, horizon: 3 });
    assert.equal(g.closedCount, 2);
    assert.equal(g.historyPoints.split(' ').length, 3);
    assert.equal(g.forecastPoints.split(' ').length, 4);
    assert.equal(g.end.value, 60_000);
    assert.equal(g.first, 10_000);
    assert.ok(g.now.x > 6 && g.now.x < g.end.x);
    assert.ok(g.end.y < g.now.y, 'рост рисуется вверх');
  });

  it('draws only the forecast when no turn is closed yet', () => {
    const g = buildForecastChart({ points: [{ cash_balance: 5_000, is_projection: true }], liquidityNow: 5_000, delta: 0 });
    assert.equal(g.closedCount, 0);
    assert.equal(g.historyPoints, '');
    assert.equal(g.now.x, 6);
    assert.equal(g.now.y, g.end.y);
  });

  it('puts risk first in Monetka tip, then goal step', () => {
    assert.equal(buildAnalyticsTip({ ...lab, liabilities_to_income_ratio: 55 }).tone, 'risk');
    assert.equal(buildAnalyticsTip({ ...lab, total_monthly_income: 40_000 }).tone, 'risk');
    const goalView = { phase: 'active', currentGoal: { title: 'подушка на 2 хода' } };
    assert.equal(buildAnalyticsTip(lab, goalView).text, 'Следующий шаг цели — подушка на 2 хода');
    assert.equal(buildAnalyticsTip(calm).text, 'Всё устойчиво — так держать');
  });
});
