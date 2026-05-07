import { Cell, Section } from '@telegram-apps/telegram-ui';

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
        {subtitle ? <span className="analytics-bar-caption__sub">{subtitle}</span> : null}
      </div>
      <div className="analytics-bar-track" role="presentation">
        <div className={`analytics-bar-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Обзор и мини-визуализации по уже доступным данным overview.
 * Подробнее о расширениях см. docs/ANALYTICS_CONCEPT.md
 */
export function AnalyticsSection({ overview }) {
  if (!overview) return null;

  const income = Number(overview.total_monthly_income) || 0;
  const liabPay = Number(overview.total_monthly_liabilities_payment) || 0;
  const maintenance = Number(overview.total_monthly_assets_maintenance) || 0;
  const denom = Math.max(income, liabPay + maintenance, 1);

  const ratio = overview.liabilities_to_income_ratio;
  const overdue = Number(overview.total_overdue_amount) || 0;

  let cushionFraction = 0;
  let cushionLabel = '';
  if (typeof overview.win_target_safety_fund === 'number' && overview.win_target_safety_fund > 0) {
    cushionFraction =
      overview.safety_fund_balance / overview.win_target_safety_fund;
    cushionLabel = `${overview.safety_fund_balance.toFixed(0)} / ${overview.win_target_safety_fund.toFixed(0)} ₽`;
  }

  const period = overview.period_index;

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
              subtitle={cushionLabel}
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

      <Section header="Потоки месяца (нагрузка)">
        <Cell multiline>
          <BarCompare
            title="Доля доходов (к масштабу max)"
            fraction={income / denom}
            subtitle={`${income.toFixed(0)} ₽/мес`}
            accent="success"
          />
          <div style={{ height: 10 }} />
          <BarCompare
            title="Платежи по долгам"
            fraction={liabPay / denom}
            subtitle={`${liabPay.toFixed(0)} ₽/мес`}
            accent={liabPay > income ? 'danger' : 'violet'}
          />
          <div style={{ height: 10 }} />
          <BarCompare
            title="Обслуживание активов"
            fraction={maintenance / denom}
            subtitle={`${maintenance.toFixed(0)} ₽/мес`}
            accent="neutral"
          />
        </Cell>
      </Section>

      <Section header="Риски и здоровье">
        <Cell multiline>
          <div>Долговая нагрузка к доходу: {(ratio || 0).toFixed(1)}%</div>
          <div>Сумма просрочек: {overdue.toFixed(2)} ₽</div>
          <div>Обязательств в месяц (весь блок): {(overview.total_monthly_obligations ?? 0).toFixed(2)} ₽</div>
          <div>Чистый поток в модели месяца: {overview.net_monthly_cashflow.toFixed(2)} ₽</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.88 }}>
            Расширенные графики, история по периодам и советы см. концепт в документации проекта —
            файл <strong>docs/ANALYTICS_CONCEPT.md</strong>.
          </div>
        </Cell>
      </Section>
    </>
  );
}
