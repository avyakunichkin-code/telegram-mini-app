import { CAPITAL_FLOWS_SECTION } from '../../../utils/capitalFlowsNav';
import { FINANCES_OF_TURN } from '../../../constants/turnCopy';
import { MoneyText } from '../../MoneyText';

function moneyAria(n) {
  const abs = Math.abs(Math.round(Number(n) || 0)).toLocaleString('ru-RU');
  return `${abs} руб.`;
}

/** Ячейка денег: кнопка в раздел «Капитала», если есть навигация, иначе статичная. */
function MoneyCell({ label, children, ariaLabel, section, onNavigate, className = '' }) {
  const cls = ['mqx-bg-money__cell', className].filter(Boolean).join(' ');
  const body = (
    <>
      <small className="mqx-bg-money__label">{label}</small>
      <b className="mqx-bg-money__value">{children}</b>
    </>
  );
  if (section && onNavigate) {
    return (
      <button
        type="button"
        className={`mqx-bg-btn ${cls} mqx-bg-money__cell--action`}
        aria-label={`${ariaLabel}, открыть раздел`}
        onClick={() => onNavigate(section)}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={cls} role="group" aria-label={ariaLabel}>
      {body}
    </div>
  );
}

export function MqxFinancePeriodBlock({
  safety = 0,
  cushionPercent = null,
  income = { label: 'Доходы за ход', value: 0 },
  outflow = 0,
  onFlowsNavigate,
}) {
  const incomeValue = Math.max(0, Number(income?.value) || 0);
  const outflowValue = Math.max(0, Number(outflow) || 0);

  return (
    <section className="mqx-bg-money" aria-label={FINANCES_OF_TURN} data-onboarding-anchor="finance-flows">
      <h2 className="mqx-bg-sr-only">{FINANCES_OF_TURN}</h2>
      <div className="mqx-bg-money__grid">
        <MoneyCell
          label="Доходы"
          ariaLabel={`${income.label} плюс ${moneyAria(incomeValue)}`}
          section={CAPITAL_FLOWS_SECTION.income}
          onNavigate={onFlowsNavigate}
          className="mqx-bg-money__cell--gain"
        >
          <MoneyText value={incomeValue} decimals={0} />
        </MoneyCell>
        <MoneyCell
          label="Расходы"
          ariaLabel={`Расходы за ход ${moneyAria(outflowValue)}`}
          section={CAPITAL_FLOWS_SECTION.expense}
          onNavigate={onFlowsNavigate}
        >
          <MoneyText value={outflowValue} decimals={0} />
        </MoneyCell>
        <MoneyCell
          label="Подушка"
          ariaLabel={
            (cushionPercent != null
              ? `Подушка ${moneyAria(safety)}, наполнение ${cushionPercent}% от нормы`
              : `Подушка ${moneyAria(safety)}`) + ', не платит расходы хода'
          }
        >
          <MoneyText value={safety} decimals={0} />
        </MoneyCell>
      </div>
    </section>
  );
}
