import { useEffect, useState } from 'react';
import { Cell, Section } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { MoneyText } from './MoneyText';
import { AnalyticsBalanceCharts } from './AnalyticsCharts';
import { IconStreakStat } from './icons/StatIcons';

function BarCompare({ title, fraction, subtitle, accent }) {
  const pct = Math.round(Math.min(100, Math.max(0, fraction * 100)));
  const tone =
    accent === 'danger'
      ? 'analytics-bar-fill--danger'
      : accent === 'success'
        ? 'analytics-bar-fill--success'
        : accent === 'violet'
          ? 'analytics-bar-fill--violet'
          : 'analytics-bar-fill--neutral';

  return (
    <div className="analytics-bar-block">
      <div className="analytics-bar-caption">
        <span className="analytics-bar-caption__title">{title}</span>
        {subtitle != null && subtitle !== '' ? (
          <span className="analytics-bar-caption__sub">{subtitle}</span>
        ) : null}
      </div>
      <div className="analytics-bar-track" role="presentation">
        <div className={`analytics-bar-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Обзор, бары и мини-графики по данным overview + ряд закрытий периодов (API).
 */
export function AnalyticsSection({ overview }) {
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
    return () => { cancelled = true; };
  }, [overview?.period_index, overview?.cash_balance]);

  if (!overview) return null;

  const income = Number(overview.total_monthly_income) || 0;
  const liabPay = Number(overview.total_monthly_liabilities_payment) || 0;
  const maintenance = Number(overview.total_monthly_assets_maintenance) || 0;
  const denom = Math.max(income, liabPay + maintenance, 1);

  const ratio = overview.liabilities_to_income_ratio;
  const overdue = Number(overview.total_overdue_amount) || 0;

  let cushionFraction = 0;
  let cushionSubtitle = '';
  if (typeof overview.win_target_safety_fund === 'number' && overview.win_target_safety_fund > 0) {
    cushionFraction = overview.safety_fund_balance / overview.win_target_safety_fund;
    cushionSubtitle = `${Number(overview.safety_fund_balance).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / ${Number(overview.win_target_safety_fund).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`;
  }

  const period = overview.period_index;
  const streak = ts?.clean_period_streak ?? overview.clean_period_streak ?? 0;

  return (
    <>
      <Section header={`Период и цель №${period}`}>
        <Cell multiline subtitle="Ставка победы (MVP): подушка к обязательствам, без просрочек, неотрицательный поток.">
          <div style={{ marginBottom: 8 }}>
            Статус:{' '}
            <strong>{overview.win_reached ? 'победа' : overview.win_ready ? 'почти' : 'в работе'}</strong>
          </div>
          {overview.win_target_safety_fund > 0 ? (
            <BarCompare
              title="Прогресс подушки к цели"
              fraction={cushionFraction}
              subtitle={cushionSubtitle}
              accent={
                cushionFraction >= 1
                  ? 'success'
                  : cushionFraction >= 0.66
                    ? 'violet'
                    : 'neutral'
              }
            />
          ) : null}
        </Cell>
      </Section>

      <Section header="Мотивация">
        <Cell multiline>
          <div className="mq-streak-row">
            <IconStreakStat size={20} />
            <div>
              <div className="mq-streak-row__title">Чистые месяцы подряд</div>
              <div className="mq-streak-row__text">
                <strong>{streak}</strong> — периодов закрыто без просрочек по обязательствам.
                {streak >= 3 ? ' Отличная дисциплина.' : null}
              </div>
            </div>
          </div>
        </Cell>
      </Section>

      <Section header="Динамика (закрытые периоды)">
        <Cell multiline>
          {tsError ? <div className="mq-ts-error">{tsError}</div> : null}
          {ts && !tsError ? (
            <>
              <AnalyticsBalanceCharts timeseriesPayload={ts} />
              <p className="mq-spark-hint">
                Первая точка появляется после завершения первого периода. Последняя колонка — текущий снимок.
              </p>
            </>
          ) : null}
          {!ts && !tsError ? <div className="mq-ts-error">Загрузка графиков…</div> : null}
        </Cell>
      </Section>

      <Section header="Потоки месяца (нагрузка)">
        <Cell multiline>
          <BarCompare
            title="Доля доходов (к масштабу max)"
            fraction={income / denom}
            subtitle={`${income.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent="success"
          />
          <div style={{ height: 10 }} />
          <BarCompare
            title="Платежи по долгам"
            fraction={liabPay / denom}
            subtitle={`${liabPay.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent={liabPay > income ? 'danger' : 'violet'}
          />
          <div style={{ height: 10 }} />
          <BarCompare
            title="Обслуживание активов"
            fraction={maintenance / denom}
            subtitle={`${maintenance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent="neutral"
          />
        </Cell>
      </Section>

      <Section header="Риски и здоровье">
        <Cell multiline>
          <div>Долговая нагрузка к доходу: {(ratio || 0).toFixed(1)}%</div>
          <div>
            Сумма просрочек: <MoneyText value={overdue} />
          </div>
          <div>
            Обязательств в месяц (весь блок): <MoneyText value={overview.total_monthly_obligations ?? 0} />
          </div>
          <div>
            Чистый поток в модели месяца: <MoneyText value={overview.net_monthly_cashflow} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.88 }}>
            Расширения (водопад, сценарии «что если»): <strong>docs/ANALYTICS_CONCEPT.md</strong>
          </div>
        </Cell>
      </Section>
    </>
  );
}
