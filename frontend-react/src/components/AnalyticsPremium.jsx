import { useEffect, useMemo, useState } from 'react';
import { API } from '../api';
import { MoneyText } from './MoneyText';
import { SparkLineSvg, CashForecastSpark } from './AnalyticsCharts';
import { IconPercentStat, IconOverdueStat, IconShieldStat, IconFlowStat } from './icons/StatIcons';
import { MqStatRow } from './MqStatRow';
import { MqxGoalBar, MqxCashflowBar, pctClamp01 } from './mqx/MqxMetricBars';
import { MqxTabHero } from './MqxTabHero';

function formatSignedMoney(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}` : v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export function AnalyticsPremium({ overview }) {
  const [ts, setTs] = useState(null);
  const [tsError, setTsError] = useState(null);

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
          setTsError(e?.detail || e?.message || 'Не удалось загрузить ряд');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [overview?.period_index, overview?.cash_balance]);

  const model = useMemo(() => {
    if (!overview) return null;

    const income = Number(overview.total_monthly_income) || 0;
    const liabPay = Number(overview.total_monthly_liabilities_payment) || 0;
    const maintenance = Number(overview.total_monthly_assets_maintenance) || 0;
    const denom = Math.max(income, liabPay + maintenance, 1);

    const cash = Number(overview.cash_balance) || 0;
    const safety = Number(overview.safety_fund_balance) || 0;
    const net = Number(overview.net_monthly_cashflow) || 0;
    const obligations = Number(overview.total_monthly_obligations) || 0;
    const ratio = Number(overview.liabilities_to_income_ratio) || 0;
    const overdue = Number(overview.total_overdue_amount) || 0;
    const score = Number(overview.score) || 0;

    const winTarget = Number(overview.win_target_safety_fund) || 0;
    const cushionFrac = winTarget > 0 ? safety / winTarget : 0;

    const capitalTarget = Math.max(winTarget * 1.25, cash * 1.15, obligations * 6, 1);
    const capitalFrac = cash / capitalTarget;

    const flowTarget = Math.max(income * 0.25, obligations * 0.5, 1);
    const flowFracRaw = net >= 0 ? net / flowTarget : 0;
    const flowFrac = flowFracRaw;

    const goalsProgress =
      winTarget > 0
        ? (pctClamp01(capitalFrac) + pctClamp01(cushionFrac) + pctClamp01(flowFracRaw)) / 3
        : (pctClamp01(capitalFrac) + pctClamp01(flowFracRaw)) / 2;

    const stressIndex = Math.min(
      99,
      Math.round(Math.min(ratio, 120) * 0.5 + (overdue > 1 ? 26 : overdue > 0 ? 14 : 0) + (net < 0 ? 20 : 0)),
    );

    const runwayMonths = obligations > 0 ? Math.floor(cash / obligations) : cash > 0 ? 99 : 0;

    const pts = ts?.points ?? [];
    const horizonLabel = pts.length;

    const projectedEnd = cash + net * 12;

    return {
      income,
      liabPay,
      maintenance,
      denom,
      cash,
      safety,
      net,
      obligations,
      ratio,
      overdue,
      score,
      winTarget,
      cushionFrac,
      capitalTarget,
      capitalFrac,
      flowTarget,
      flowFrac,
      goalsProgress,
      stressIndex,
      runwayMonths,
      horizonLabel,
      projectedEnd,
      streak: ts?.clean_period_streak ?? overview.clean_period_streak ?? 0,
    };
  }, [overview, ts]);

  if (!overview || !model) return null;

  const {
    income,
    liabPay,
    maintenance,
    denom,
    cash,
    safety,
    net,
    obligations,
    ratio,
    overdue,
    score,
    winTarget,
    cushionFrac,
    capitalTarget,
    capitalFrac,
    flowTarget,
    flowFrac,
    goalsProgress,
    stressIndex,
    runwayMonths,
    horizonLabel,
    projectedEnd,
    streak,
  } = model;

  const scoreFillPct = Math.min(100, Math.max(0, score));
  const pts = ts?.points ?? [];
  const lastCash = pts.length ? Number(pts[pts.length - 1]?.cash_balance) : cash;
  const lastSafety = pts.length ? Number(pts[pts.length - 1]?.safety_fund_balance) : safety;

  return (
    <>
      <MqxTabHero
        sectionLabel="Аналитика"
        rightPill={`Период #${overview.period_index}`}
        title="Финансовая картина"
        subtitle="Рейтинг, цели, потоки и динамика — в одном стиле с главной."
      />

      <main className="mqx-content mqx-analytics-page">
        <section className="mqx-card mqx-analytics-level">
          <div className="mqx-analytics-level__top">
            <div>
              <div className="mqx-card__kicker mqx-card__kicker--violet">Финансовый уровень</div>
              <div className="mqx-analytics-level__title">{overview.gamification_level}</div>
              <p className="mqx-analytics-level__sub">Период игры #{overview.period_index} · чистых месяцев подряд: {streak}</p>
            </div>
            <div className="mqx-analytics-level__score-chip" aria-label="Очки рейтинга">
              <div className="mqx-analytics-level__score-label">Очки</div>
              <div className="mqx-analytics-level__score-value">{score}</div>
            </div>
          </div>

          <div className="mqx-analytics-xp">
            <div className="mqx-analytics-xp__row">
              <span>Рейтинг MQ (до 100)</span>
              <span className="mqx-analytics-xp__nums">
                {score} / 100
              </span>
            </div>
            <div className="mqx-analytics-xp__track">
              <div className="mqx-analytics-xp__fill" style={{ width: `${scoreFillPct}%` }} />
            </div>
          </div>
        </section>

        <section className="mqx-card mqx-card--analytics-goals">
          <div className="mqx-analytics-goals__top">
            <div>
              <div className="mqx-analytics-goals__kicker">Цели игрока</div>
              <h2 className="mqx-analytics-goals__title">Прогресс</h2>
            </div>
            <div className="mqx-analytics-goals__badge">
              <div className="mqx-analytics-goals__badge-label">Сводно</div>
              <div className="mqx-analytics-goals__badge-value">{Math.round(pctClamp01(goalsProgress) * 100)}%</div>
            </div>
          </div>

          <div className="mqx-analytics-goals__list">
            <MqxGoalBar
              label="Капитал на счёте"
              valueNode={
                <>
                  <MoneyText value={cash} decimals={0} /> / <MoneyText value={capitalTarget} decimals={0} />
                </>
              }
              fraction={capitalFrac}
              fillClass="mqx-analytics-goal-fill--violet"
            />
            {winTarget > 0 ? (
              <MqxGoalBar
                label="Финансовая подушка"
                valueNode={
                  <>
                    <MoneyText value={safety} decimals={0} /> / <MoneyText value={winTarget} decimals={0} />
                  </>
                }
                fraction={cushionFrac}
                fillClass="mqx-analytics-goal-fill--emerald"
              />
            ) : (
              <MqxGoalBar
                label="Финансовая подушка"
                valueNode={<>Цель подушки не задана (нет обязательств в модели)</>}
                fraction={0}
                fillClass="mqx-analytics-goal-fill--emerald"
              />
            )}
            <MqxGoalBar
              label="Чистый поток"
              valueNode={
                <>
                  <MoneyText value={net} decimals={0} /> / ориентир <MoneyText value={flowTarget} decimals={0} />
                </>
              }
              fraction={flowFrac}
              fillClass="mqx-analytics-goal-fill--sky"
            />
          </div>
        </section>

        <section className="mqx-card mqx-card--analytics-dark">
          <div className="mqx-analytics-dark__head">
            <div>
              <div className="mqx-analytics-dark__kicker">Аналитика</div>
              <h2 className="mqx-analytics-dark__title">Динамика капитала</h2>
            </div>
            <div className="mqx-analytics-dark__chip">{horizonLabel ? `${horizonLabel} точек` : '—'}</div>
          </div>

          <div className="mqx-analytics-dark__charts">
            {tsError ? <div className="mqx-analytics-dark__err">{tsError}</div> : null}
            {!ts && !tsError ? <div className="mqx-analytics-dark__err">Загрузка…</div> : null}
            {ts && !tsError && pts.length > 0 ? (
              <>
                <div className="mqx-analytics-dark__spark-wrap">
                  <SparkLineSvg
                    series={pts.map((p) => Number(p.cash_balance))}
                    title="Денежный счёт"
                    subtitle={`${Number.isFinite(lastCash) ? lastCash.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽`}
                    accent="violet"
                    dark
                    height={56}
                  />
                </div>
                <div className="mqx-analytics-dark__spark-wrap">
                  <SparkLineSvg
                    series={pts.map((p) => Number(p.safety_fund_balance))}
                    title="Подушка безопасности"
                    subtitle={`${Number.isFinite(lastSafety) ? lastSafety.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽`}
                    accent="emerald"
                    dark
                    height={52}
                  />
                </div>
                <p className="mqx-analytics-dark__hint">История закрытых периодов и снимок текущего месяца.</p>
              </>
            ) : null}
            {ts && !tsError && pts.length === 0 ? (
              <div className="mqx-analytics-dark__err">Пока нет закрытых периодов — график появится после первого перехода месяца.</div>
            ) : null}
          </div>
        </section>

        <section className="mqx-card mqx-analytics-cashflow mqx-analytics-cashflow--after-charts">
          <div className="mqx-analytics-cashflow__head">
            <div>
              <div className="mqx-card__kicker mqx-card__kicker--violet">Потоки месяца</div>
              <h2 className="mqx-analytics-cashflow__title">Здоровье cashflow</h2>
            </div>
            <div className={`mqx-analytics-cashflow__pill ${net >= 0 ? 'mqx-analytics-cashflow__pill--pos' : 'mqx-analytics-cashflow__pill--neg'}`}>
              {formatSignedMoney(net)} ₽
            </div>
          </div>

          <div className="mqx-analytics-cashflow__bars">
            <MqxCashflowBar
              label="Доход"
              amountNode={
                <span>
                  <MoneyText value={income} decimals={0} />{' '}
                  <span className="mqx-analytics-cf-suffix">/мес</span>
                </span>
              }
              fraction={income / denom}
              fillClass="mqx-analytics-cf-fill--emerald"
            />
            <MqxCashflowBar
              label="Платежи по долгам"
              amountNode={
                <span>
                  <MoneyText value={liabPay} decimals={0} />{' '}
                  <span className="mqx-analytics-cf-suffix">/мес</span>
                </span>
              }
              fraction={liabPay / denom}
              fillClass={liabPay > income ? 'mqx-analytics-cf-fill--rose' : 'mqx-analytics-cf-fill--violet'}
            />
            <MqxCashflowBar
              label="Обслуживание активов"
              amountNode={
                <span>
                  <MoneyText value={maintenance} decimals={0} />{' '}
                  <span className="mqx-analytics-cf-suffix">/мес</span>
                </span>
              }
              fraction={maintenance / denom}
              fillClass="mqx-analytics-cf-fill--slate"
            />
          </div>
          <div className="mqx-analytics-cashflow__hint" role="note">
            {(() => {
              const n = Number(overview.avg_net_cashflow_6p_n) || 0;
              const v = Number(overview.avg_net_cashflow_6p);
              if (n <= 0) {
                return (
                  <>
                    После нескольких закрытых периодов здесь появится среднее изменение наличных и подушки между
                    закрытиями (до шести последних интервалов).
                  </>
                );
              }
              return (
                <>
                  Среднее изменение (наличные + подушка) по {n}{' '}
                  {n === 1 ? 'интервалу' : 'интервалам'} между закрытиями:{' '}
                  <strong>{formatSignedMoney(v)} ₽</strong>
                </>
              );
            })()}
          </div>
        </section>

        <section className="mqx-card mqx-analytics-lifestyle">
          <div className="mqx-analytics-lifestyle__head">
            <div>
              <div className="mqx-card__kicker mqx-card__kicker--amber">Нагрузка</div>
              <h2 className="mqx-analytics-lifestyle__title">Стресс и устойчивость</h2>
            </div>
            <div className="mqx-analytics-lifestyle__stress">
              <div className="mqx-analytics-lifestyle__stress-label">Индекс</div>
              <div className="mqx-analytics-lifestyle__stress-value">{stressIndex}</div>
            </div>
          </div>

          <div className="mqx-analytics-lifestyle__bar-block">
            <div className="mqx-analytics-lifestyle__bar-row">
              <span className="mqx-analytics-lifestyle__bar-caption">Обязательства к доходу</span>
              <span className="mqx-analytics-lifestyle__bar-pct">{ratio.toFixed(1)}%</span>
            </div>
            <div className="mqx-analytics-lifestyle__track">
              <div className="mqx-analytics-lifestyle__fill" style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }} />
            </div>
          </div>

          <div className="mqx-analytics-runway">
            <div className="mqx-analytics-runway__label">Ориентировочно, сколько периодов хватит счёта при текущих обязательствах</div>
            <div className="mqx-analytics-runway__value">{obligations > 0 ? `${runwayMonths} пер.` : '—'}</div>
          </div>

          <div className="mqx-analytics-risks" style={{ marginTop: 14 }}>
            <MqStatRow dense icon={<IconOverdueStat />} label="Просрочки">
              <MoneyText value={overdue} />
            </MqStatRow>
            <MqStatRow dense icon={<IconShieldStat />} label="Обязательства в месяц">
              <MoneyText value={obligations} />
            </MqStatRow>
            <MqStatRow dense icon={<IconFlowStat />} label="Чистый поток (модель)">
              <MoneyText value={net} />
            </MqStatRow>
            <MqStatRow dense icon={<IconPercentStat />} label="Статус победы">
              <strong>{overview.win_reached ? 'победа' : overview.win_ready ? 'почти' : 'в работе'}</strong>
            </MqStatRow>
          </div>
        </section>

        <section className="mqx-card mqx-card--analytics-forecast">
          <div className="mqx-analytics-forecast__head">
            <div>
              <div className="mqx-analytics-forecast__kicker">Прогноз</div>
              <h2 className="mqx-analytics-forecast__title">Счёт через 12 периодов</h2>
            </div>
            <div className="mqx-analytics-forecast__side">
              <div className="mqx-analytics-forecast__side-label">+12 пер.</div>
              <div className="mqx-analytics-forecast__side-value">
                <MoneyText value={projectedEnd} decimals={0} />
              </div>
            </div>
          </div>

          <div className="mqx-analytics-forecast__chart">
            {ts && !tsError ? <CashForecastSpark timeseriesPayload={ts} netMonthly={net} /> : null}
            {!ts && !tsError ? <div className="mqx-analytics-forecast__placeholder">Загрузка прогноза…</div> : null}
          </div>

          <div className="mqx-analytics-forecast__callout">
            <div className="mqx-analytics-forecast__callout-text">
              Линейная оценка: текущий чистый поток × 12 периодов к последнему значению на графике. Не учитывает события и
              новые сделки.
            </div>
            <div className="mqx-analytics-forecast__callout-sum">
              <MoneyText value={projectedEnd} decimals={0} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
