import { useEffect, useState } from 'react';
import { Cell, Section } from '@telegram-apps/telegram-ui';
import { API, ApiError, formatApiErrorDetail } from '../api';
import { MoneyText } from './MoneyText';
import { AnalyticsBalanceCharts } from './AnalyticsCharts';
import { IconStreakStat, IconPercentStat, IconOverdueStat, IconShieldStat, IconFlowStat } from './icons/StatIcons';
import { MqStatRow } from './MqStatRow';

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
    cushionSubtitle = `${Number(overview.safety_fund_balance).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} / ${Number(overview.win_target_safety_fund).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ₽`;
  }

  const period = overview.period_index;
  const streak = ts?.clean_period_streak ?? overview.clean_period_streak ?? 0;

  return (
    <div className="mq-stack mq-stack-animate mq-stack--tight">
      <div className="mq-enter-item">
        <div className="mq-slot-intro">
          Те же смыслы, что на главной: цель периода, нагрузка потоков, риски — плюс динамика по закрытым месяцам.
        </div>
      </div>

      <div className="mq-enter-item">
        <Section header={`Период и цель №${period}`}>
          <div className="mq-slot-intro">
            Ставка победы (MVP): подушка к обязательствам, без просрочек, неотрицательный поток.
          </div>
          <Cell multiline>
            <MqStatRow dense icon={<IconFlowStat />} label="Статус цели">
              <strong>{overview.win_reached ? 'победа' : overview.win_ready ? 'почти' : 'в работе'}</strong>
            </MqStatRow>
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
      </div>

      <div className="mq-enter-item">
        <Section header="Мотивация">
          <div className="mq-slot-intro">Серия «чистых» закрытых месяцев — без новых просрочек по обязательствам.</div>
          <Cell multiline>
            <div className="mq-streak-row">
              <IconStreakStat size={20} />
              <div>
                <div className="mq-streak-row__title">Чистые месяцы подряд</div>
                <div className="mq-streak-row__text">
                  <strong>{streak}</strong> — таких периодов подряд.
                  {streak >= 3 ? ' Отличная дисциплина.' : null}
                </div>
              </div>
            </div>
          </Cell>
        </Section>
      </div>

      <div className="mq-enter-item">
        <Section header="Динамика (закрытые периоды)">
          <div className="mq-slot-intro">История балансов и подушки; последняя колонка — текущий «снимок».</div>
          <Cell multiline>
            {tsError ? <div className="mq-ts-error">{tsError}</div> : null}
            {ts && !tsError ? (
              <>
                <AnalyticsBalanceCharts timeseriesPayload={ts} />
                <p className="mq-spark-hint">
                  Первая точка после завершения первого полного периода.
                </p>
              </>
            ) : null}
            {!ts && !tsError ? <div className="mq-ts-error">Загрузка графиков…</div> : null}
          </Cell>
        </Section>
      </div>

      <div className="mq-enter-item">
        <Section header="Потоки месяца (нагрузка)">
          <div className="mq-slot-intro">Соотношение ваших ключевых ежемесячных колонок в одном масштабе.</div>
          <Cell multiline>
            <div className="mq-bar-stack">
              <BarCompare
                title="Доля доходов (к масштабу max)"
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
          </Cell>
        </Section>
      </div>

      <div className="mq-enter-item">
        <Section header="Риски и здоровье">
          <div className="mq-slot-intro">Цифры в том же формате строк, что на главном экране.</div>
          <Cell multiline>
            <MqStatRow dense icon={<IconPercentStat />} label="Долговая нагрузка к доходу">
              {(ratio || 0).toFixed(1)}%
            </MqStatRow>
            <MqStatRow dense icon={<IconOverdueStat />} label="Сумма просрочек">
              <MoneyText value={overdue} />
            </MqStatRow>
            <MqStatRow dense icon={<IconShieldStat />} label="Обязательств в месяц (блок целиком)">
              <MoneyText value={overview.total_monthly_obligations ?? 0} />
            </MqStatRow>
            <MqStatRow dense icon={<IconFlowStat />} label="Чистый поток в модели месяца">
              <MoneyText value={overview.net_monthly_cashflow} />
            </MqStatRow>
            <p className="mq-caption-muted">
              Документ с идеями развития аналитики: <strong>docs/specs/SPEC_ANALYTICS.md</strong>
            </p>
          </Cell>
        </Section>
      </div>
    </div>
  );
}
