import { MoneyText } from '../../MoneyText';

/** Предупреждение: автосписания в конце месяца и риск поражения по cash. */
export function MqxPeriodCloseRiskBanner({ preview, periodIndex }) {
  if (!preview) return null;

  const estimated = Number(preview.estimated_cash_after_close) || 0;
  const streak = Number(preview.negative_periods_count) || 0;
  const defeatRisk = Boolean(preview.defeat_if_close_negative);
  const wouldNegative = Boolean(preview.would_be_negative_after_close);
  if (!defeatRisk && !wouldNegative && streak === 0) {
    return null;
  }

  const isCritical = defeatRisk;

  return (
    <div
      className={['mqx-close-risk', isCritical && 'mqx-close-risk--critical'].filter(Boolean).join(' ')}
      role="alert"
    >
      <p className="mqx-close-risk__title">
        {isCritical ? 'Риск поражения при закрытии месяца' : 'Списания в конце месяца'}
      </p>
      <p className="mqx-close-risk__text">
        В конце периода {periodIndex ? `№${periodIndex}` : ''} автоматически спишутся расходы на жизнь,
        обязательства, содержание имущества и страховки — даже если в течение месяца баланс был в плюсе.
      </p>
      {wouldNegative ? (
        <p className="mqx-close-risk__estimate">
          Прогноз после списаний:{' '}
          <strong>
            <MoneyText value={estimated} />
          </strong>
          {streak > 0 ? (
            <>
              {' '}
              · уже {streak} из 3 месяцев подряд в минусе
            </>
          ) : null}
        </p>
      ) : null}
      <p className="mqx-close-risk__rule">
        Поражение: три закрытых месяца подряд с отрицательным балансом на счёте после всех списаний.
      </p>
    </div>
  );
}
