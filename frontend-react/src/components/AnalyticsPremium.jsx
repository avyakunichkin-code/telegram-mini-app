import { useEffect, useMemo, useState } from 'react';
import { API, ApiError, formatApiErrorDetail } from '../api';
import { MoneyText } from './MoneyText';
import { IncomeExpenseChart, LiquidityForecastChart } from './AnalyticsCharts';
import { MqxCashflowBar, pctClamp01 } from './mqx/MqxMetricBars';
import { MqxTabHero } from './MqxTabHero';
import { getMonthlyBurn } from '../utils/expensesDisplay';
import {
  buildPrimaryInsight,
  computeCushionMonths,
  computeLiquidity,
  computeMonthlyResidual,
  computeRunwayPeriods,
  resolveForecastMonthlyDelta,
  resolveStabilityZone,
  stabilityZoneLabel,
} from '../utils/analyticsDisplay';

function formatSignedMoney(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}` : v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export function AnalyticsPremium({ overview }) {
  const [ts, setTs] = useState(null);
  const [tsError, setTsError] = useState(null);
  const [forecastMonths, setForecastMonths] = useState(3);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await API.getFinanceAnalyticsTimeseries(48);
        if (!cancelled) {
          setTs(data);
          setTsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setTs(null);
          const msg =
            e instanceof ApiError
              ? formatApiErrorDetail(e.detail, e.message)
              : formatApiErrorDetail(e?.detail ?? e?.message, e?.message || 'Не удалось загрузить ряд');
          setTsError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [overview?.period_index, overview?.cash_balance, overview?.safety_fund_balance]);

  const model = useMemo(() => {
    if (!overview) return null;

    const income = Number(overview.total_monthly_income) || 0;
    const liabPay = Number(overview.total_monthly_liabilities_payment) || 0;
    const maintenance = Number(overview.total_monthly_assets_maintenance) || 0;
    const burn = getMonthlyBurn(overview);
    const expenseRatioPct = income > 0 ? (burn / income) * 100 : 0;
    const denom = Math.max(income, liabPay + maintenance + burn, 1);
    const cash = Number(overview.cash_balance) || 0;
    const safety = Number(overview.safety_fund_balance) || 0;
    const ratio = Number(overview.liabilities_to_income_ratio) || 0;
    const liquidity = computeLiquidity(overview);
    const residual = computeMonthlyResidual(overview);
    const cushionMonths = computeCushionMonths(overview);
    const runway = computeRunwayPeriods(overview);
    const zone = resolveStabilityZone(overview);
    const monthlyDelta = resolveForecastMonthlyDelta(overview);
    const insight = buildPrimaryInsight(overview);

    return {
      income,
      liabPay,
      maintenance,
      burn,
      expenseRatioPct,
      denom,
      cash,
      safety,
      ratio,
      liquidity,
      residual,
      cushionMonths,
      runway,
      zone,
      monthlyDelta,
      insight,
    };
  }, [overview]);

  if (!overview || !model) return null;

  const {
    income,
    liabPay,
    maintenance,
    burn,
    expenseRatioPct,
    denom,
    cash,
    safety,
    ratio,
    liquidity,
    residual,
    cushionMonths,
    runway,
    zone,
    monthlyDelta,
    insight,
  } = model;

  const pts = ts?.points ?? [];
  const isGame = overview.save_kind !== 'plan';

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        sectionLabel="Аналитика"
        rightPill={`Ход #${overview.period_index}`}
        title="Финансовое состояние"
        subtitle="Снимок, потоки и прогноз при текущей модели месяца"
      />

      <main className="mqx-content mqx-tab-page__scroll mqx-analytics-page">
        <section className="mqx-card mqx-analytics-snapshot">
          <div className="mqx-analytics-snapshot__top">
            <div>
              <div className="mqx-card__kicker mqx-card__kicker--emerald">Снимок</div>
              <div className="mqx-analytics-snapshot__value">
                <MoneyText value={liquidity} decimals={0} />
              </div>
              <div className="mqx-analytics-snapshot__meta">
                Счёт <MoneyText value={cash} decimals={0} /> + подушка <MoneyText value={safety} decimals={0} />
              </div>
            </div>
            <div className={`mqx-analytics-zone mqx-analytics-zone--${zone}`} aria-label={stabilityZoneLabel(zone)}>
              {stabilityZoneLabel(zone)}
            </div>
          </div>
          <div
            className={`mqx-analytics-residual${residual < 0 ? ' mqx-analytics-residual--neg' : ''}`}
            role="note"
          >
            <span>После обязательств и жизни</span>
            <strong>
              {formatSignedMoney(residual)} ₽
            </strong>
          </div>
        </section>

        <section className="mqx-card mqx-analytics-cashflow">
          <div className="mqx-card__kicker">Поток месяца</div>
          <h2 className="mqx-analytics-cashflow__title">Куда уходит доход</h2>
          <div className="mqx-analytics-cashflow__bars">
            <MqxCashflowBar
              label="Доход"
              amountNode={<MoneyText value={income} decimals={0} />}
              fraction={income / denom}
              fillClass="mqx-analytics-cf-fill--emerald"
            />
            <MqxCashflowBar
              label={
                <>
                  Платежи по долгам
                  {income > 0 ? (
                    <span className="mqx-analytics-cf-pct"> {ratio.toFixed(0)}%</span>
                  ) : null}
                </>
              }
              amountNode={
                <span>
                  −<MoneyText value={liabPay} decimals={0} />
                </span>
              }
              fraction={liabPay / denom}
              fillClass={liabPay > income ? 'mqx-analytics-cf-fill--rose' : 'mqx-analytics-cf-fill--violet'}
            />
            <MqxCashflowBar
              label="Обслуживание активов"
              amountNode={
                <span>
                  −<MoneyText value={maintenance} decimals={0} />
                </span>
              }
              fraction={maintenance / denom}
              fillClass="mqx-analytics-cf-fill--slate"
            />
            {burn > 0 ? (
              <MqxCashflowBar
                label={
                  <>
                    Расходы на жизнь
                    {income > 0 ? (
                      <span className="mqx-analytics-cf-pct"> {expenseRatioPct.toFixed(0)}%</span>
                    ) : null}
                  </>
                }
                amountNode={
                  <span>
                    −<MoneyText value={burn} decimals={0} />
                  </span>
                }
                fraction={burn / denom}
                fillClass="mqx-analytics-cf-fill--amber"
              />
            ) : null}
          </div>
        </section>

        <section className="mqx-card mqx-analytics-stability">
          <div className="mqx-card__kicker mqx-card__kicker--amber">Устойчивость</div>
          <h2 className="mqx-analytics-stability__title">Риски и запас</h2>
          <div className="mqx-analytics-metrics">
            <div className="mqx-analytics-metric">
              <div className="mqx-analytics-metric__label">Подушка, мес.</div>
              <div className="mqx-analytics-metric__value">{cushionMonths.toFixed(1).replace('.', ',')}</div>
            </div>
            <div className="mqx-analytics-metric">
              <div className="mqx-analytics-metric__label">Runway счёта</div>
              <div className="mqx-analytics-metric__value">
                {runway >= 99 ? '—' : `${runway} пер.`}
              </div>
            </div>
            <div className="mqx-analytics-metric mqx-analytics-metric--wide">
              <div className="mqx-analytics-metric__label">Платежи по долгам к доходу (ПДН)</div>
              <div className="mqx-analytics-metric__value">{ratio.toFixed(0)}%</div>
              <div className="mqx-analytics-dti-track">
                <div
                  className="mqx-analytics-dti-fill"
                  style={{ width: `${Math.round(pctClamp01(ratio / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mqx-card mqx-card--analytics-dark">
          <div className="mqx-analytics-dark__kicker">Динамика</div>
          <h2 className="mqx-analytics-dark__title">Графики по закрытым ходам</h2>

          <div className="mqx-analytics-dark__charts">
            {tsError ? <div className="mqx-analytics-dark__err">{tsError}</div> : null}
            {!ts && !tsError ? <div className="mqx-analytics-dark__err">Загрузка…</div> : null}
            {ts && !tsError ? (
              <>
                <IncomeExpenseChart points={pts} />
                <LiquidityForecastChart
                  points={pts}
                  liquidityNow={liquidity}
                  monthlyDelta={monthlyDelta}
                  forecastMonths={forecastMonths}
                  onForecastMonthsChange={setForecastMonths}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="mqx-analytics-insight" aria-live="polite">
          <div className="mqx-analytics-insight__icon" aria-hidden>
            !
          </div>
          <div>
            <p className="mqx-analytics-insight__title">{insight.title}</p>
            <p className="mqx-analytics-insight__body">{insight.body}</p>
          </div>
        </section>

        {isGame ? (
          <p className="mqx-analytics-foot">Цели партии — на вкладке «Главная»</p>
        ) : null}
      </main>
    </div>
  );
}
