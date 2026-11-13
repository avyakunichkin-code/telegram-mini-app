import { useEffect, useMemo, useState } from 'react';
import { API, ApiError, formatApiErrorDetail } from '../api';
import { MoneyText } from './MoneyText';
import { IncomeSplitBar, LiquidityForecastChart } from './AnalyticsCharts';
import { MonetkaAvatar } from './mqx/brand/MonetkaAvatar';
import { buildGoalChainView } from './mqx/utils/goalChainDisplay';
import {
  analyticsHeadCaption,
  buildAnalyticsTip,
  buildIncomeSplit,
  buildStabilityMetrics,
  buildStateCard,
  resolveForecastDelta,
} from './mqx/utils/analyticsBoardDisplay';

const FORECAST_TURNS = 3;

function signedMoney(amount, tone) {
  const sign = amount < 0 ? '−' : '+';
  return (
    <b className={`mqx-an-legend__sum mqx-an-legend__sum--${tone}`}>
      {sign}
      <MoneyText value={Math.abs(amount)} decimals={0} />
    </b>
  );
}

function useAnalyticsTimeseries(overview) {
  const [state, setState] = useState({ ts: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ts: s.ts, error: null }));
    API.getFinanceAnalyticsTimeseries(48)
      .then((ts) => !cancelled && setState({ ts, error: null }))
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? formatApiErrorDetail(e.detail, e.message)
            : formatApiErrorDetail(e?.detail ?? e?.message, 'Не удалось загрузить историю');
        setState({ ts: null, error: msg });
      });
    return () => {
      cancelled = true;
    };
  }, [overview?.period_index, overview?.cash_balance, overview?.safety_fund_balance, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

export function AnalyticsPremium({ overview }) {
  const { ts, error, retry } = useAnalyticsTimeseries(overview);

  const model = useMemo(() => {
    if (!overview) return null;
    return {
      state: buildStateCard(overview),
      split: buildIncomeSplit(overview),
      metrics: buildStabilityMetrics(overview),
      delta: resolveForecastDelta(overview),
      tip: buildAnalyticsTip(overview, buildGoalChainView(overview.victory, null)),
    };
  }, [overview]);

  if (!overview || !model) return null;
  const { state, split, metrics, delta, tip } = model;
  const turn = Number(overview.period_index) || 0;
  const hasHistory = (ts?.points ?? []).some((p) => !p.is_projection);

  return (
    <div className="mqx-tab-page mqx-tab-page--dash-unified mqx-tab-page--board mqx-tab-page--analytics">
      <main className="mqx-content mqx-tab-page__scroll">
        <div className="mqx-bg-stack">
          <header className="mqx-an-head">
            <div>
              <h1 className="mqx-an-head__title">Аналитика</h1>
              <p className="mqx-an-head__sub">{analyticsHeadCaption(turn)}</p>
            </div>
            {turn > 0 ? (
              <span className="mqx-an-turn">
                <span className="mqx-bg-sr-only">Ход </span>
                {turn}
              </span>
            ) : null}
          </header>

          <section className={`mqx-an-state${state.risk ? ' mqx-an-state--risk' : ''}`} aria-label="Счёт и подушка">
            <div className="mqx-an-state__top">
              <span className="mqx-an-caption">Счёт и подушка</span>
              {state.risk ? <span className="mqx-an-state__pill">{state.risk}</span> : null}
            </div>
            <MoneyText value={state.liquidity} decimals={0} className="mqx-an-state__sum" />
            <p className="mqx-an-caption">{state.note}</p>
          </section>

          <section className="mqx-an-sec" aria-labelledby="mqx-an-split-title">
            <div className="mqx-an-sec__title">
              <h2 id="mqx-an-split-title">Куда уходит доход</h2>
              {split.income > 0 ? (
                <span className="mqx-an-caption">
                  <MoneyText value={split.income} decimals={0} /> за ход
                </span>
              ) : null}
            </div>
            {split.empty ? (
              <p className="mqx-an-empty">Доходов и трат за ход пока нет — забери зарплату на «Главной».</p>
            ) : (
              <>
                <IncomeSplitBar segments={split.segments} />
                <ul className="mqx-an-legend">
                  {split.segments.map((s) => (
                    <li key={s.key}>
                      <i className={`mqx-an-tone--${s.tone}`} aria-hidden />
                      <span>{s.label}</span>
                      {signedMoney(s.amount, s.tone)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <ul className="mqx-an-metrics" aria-label="Устойчивость">
            {metrics.map((m) => (
              <li key={m.key} className={`mqx-an-metric${m.risk ? ' mqx-an-metric--risk' : ''}`}>
                <b>{m.value}</b>
                <span>
                  {m.label}
                  {m.risk ? <span className="mqx-bg-sr-only"> — есть риск</span> : null}
                </span>
              </li>
            ))}
          </ul>

          <section className="mqx-an-sec mqx-an-chart" aria-labelledby="mqx-an-chart-title">
            <div className="mqx-an-sec__title">
              <h2 id="mqx-an-chart-title">Счёт + подушка</h2>
              <span className="mqx-an-caption">история и прогноз на {FORECAST_TURNS} хода</span>
            </div>
            {error ? (
              <p className="mqx-an-empty">
                {error}{' '}
                <button type="button" className="mqx-an-retry mqx-bg-btn" onClick={retry}>
                  Повторить
                </button>
              </p>
            ) : !ts ? (
              <p className="mqx-an-empty">Загружаем историю…</p>
            ) : (
              <>
                <LiquidityForecastChart
                  points={ts.points}
                  liquidityNow={state.liquidity}
                  delta={delta}
                  horizon={FORECAST_TURNS}
                />
                <div className="mqx-an-chart__legend">
                  {hasHistory ? <span>было</span> : null}
                  <span className="mqx-an-chart__legend-fc">если ничего не менять</span>
                </div>
                {!hasHistory ? (
                  <p className="mqx-an-empty">История появится, когда завершишь первый ход.</p>
                ) : null}
              </>
            )}
          </section>

          <p className="mqx-bg-tip mqx-an-tip" data-tone={tip.tone} title={tip.text}>
            <MonetkaAvatar size={26} className="mqx-bg-tip__monetka" />
            <span className="mqx-bg-tip__text">{tip.text}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
