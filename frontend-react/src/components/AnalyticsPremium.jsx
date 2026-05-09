import { useEffect, useState } from 'react';
import { API } from '../api';
import { MoneyText } from './MoneyText';
import { AnalyticsBalanceCharts } from './AnalyticsCharts';
import { IconStreakStat, IconPercentStat, IconOverdueStat, IconShieldStat, IconFlowStat } from './icons/StatIcons';
import { MqStatRow } from './MqStatRow';

function pctClamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

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

  if (!overview) return null;

  const income = Number(overview.total_monthly_income) || 0;
  const liabPay = Number(overview.total_monthly_liabilities_payment) || 0;
  const maintenance = Number(overview.total_monthly_assets_maintenance) || 0;
  const denom = Math.max(income, liabPay + maintenance, 1);

  const ratio = overview.liabilities_to_income_ratio;
  const overdue = Number(overview.total_overdue_amount) || 0;

  const period = overview.period_index;
  const streak = ts?.clean_period_streak ?? overview.clean_period_streak ?? 0;

  const goalTarget = Number(overview.win_target_safety_fund) || 0;
  const cushionFrac = goalTarget > 0 ? overview.safety_fund_balance / goalTarget : 0;
  const cushionSubtitle =
    goalTarget > 0
      ? `${Number(overview.safety_fund_balance).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} / ${Number(goalTarget).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
      : '';

  return (
    <div className="mqx-content">
      <div className="mqx-card">
        <div className="mqx-card__kicker">Период</div>
        <div className="mqx-card__title">Цель №{period}</div>
        <div className="mqx-card__sub">
          Подушка к обязательствам, без просрочек и с неотрицательным потоком.
        </div>

        <div style={{ marginTop: 12 }}>
          <MqStatRow dense icon={<IconFlowStat />} label="Статус">
            <strong>{overview.win_reached ? 'победа' : overview.win_ready ? 'почти' : 'в работе'}</strong>
          </MqStatRow>
        </div>

        {goalTarget > 0 ? (
          <div style={{ marginTop: 10 }}>
            <BarCompare
              title="Прогресс подушки к цели"
              fraction={pctClamp01(cushionFrac)}
              subtitle={cushionSubtitle}
              accent={cushionFrac >= 1 ? 'success' : cushionFrac >= 0.66 ? 'violet' : 'neutral'}
            />
          </div>
        ) : null}
      </div>

      <div className="mqx-card">
        <div className="mqx-card__title">Мотивация</div>
        <div className="mqx-card__sub">Серия закрытых месяцев без просрочек.</div>

        <div className="mq-streak-row" style={{ marginTop: 10 }}>
          <IconStreakStat size={20} />
          <div>
            <div className="mq-streak-row__title">Чистые месяцы подряд</div>
            <div className="mq-streak-row__text">
              <strong>{streak}</strong>
              {streak >= 3 ? ' — отличная дисциплина.' : ' — продолжайте.'}
            </div>
          </div>
        </div>
      </div>

      <div className="mqx-card">
        <div className="mqx-card__title">Динамика</div>
        <div className="mqx-card__sub">История закрытых периодов + текущий снимок.</div>

        <div style={{ marginTop: 10 }}>
          {tsError ? <div className="mq-ts-error">{tsError}</div> : null}
          {ts && !tsError ? (
            <>
              <AnalyticsBalanceCharts timeseriesPayload={ts} />
              <p className="mq-spark-hint">Первая точка после завершения первого периода.</p>
            </>
          ) : null}
          {!ts && !tsError ? <div className="mq-ts-error">Загрузка…</div> : null}
        </div>
      </div>

      <div className="mqx-card">
        <div className="mqx-card__title">Потоки месяца</div>
        <div className="mqx-card__sub">Доля доходов и нагрузка расходов в одном масштабе.</div>

        <div style={{ marginTop: 10 }} className="mq-bar-stack">
          <BarCompare
            title="Доход"
            fraction={income / denom}
            subtitle={`${income.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent="success"
          />
          <BarCompare
            title="Платежи по долгам"
            fraction={liabPay / denom}
            subtitle={`${liabPay.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent={liabPay > income ? 'danger' : 'violet'}
          />
          <BarCompare
            title="Обслуживание активов"
            fraction={maintenance / denom}
            subtitle={`${maintenance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/мес`}
            accent="neutral"
          />
        </div>
      </div>

      <div className="mqx-card">
        <div className="mqx-card__title">Риски</div>
        <div className="mqx-card__sub">Сводные показатели здоровья профиля.</div>

        <div style={{ marginTop: 10 }}>
          <MqStatRow dense icon={<IconPercentStat />} label="Долговая нагрузка к доходу">
            {(ratio || 0).toFixed(1)}%
          </MqStatRow>
          <MqStatRow dense icon={<IconOverdueStat />} label="Сумма просрочек">
            <MoneyText value={overdue} />
          </MqStatRow>
          <MqStatRow dense icon={<IconShieldStat />} label="Обязательств в месяц (всего)">
            <MoneyText value={overview.total_monthly_obligations ?? 0} />
          </MqStatRow>
          <MqStatRow dense icon={<IconFlowStat />} label="Чистый поток в модели месяца">
            <MoneyText value={overview.net_monthly_cashflow} />
          </MqStatRow>
        </div>
      </div>
    </div>
  );
}

