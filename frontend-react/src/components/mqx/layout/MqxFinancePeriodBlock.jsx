import { CAPITAL_FLOWS_SECTION } from '../../../utils/capitalFlowsNav';
import { FINANCES_OF_TURN } from '../../../constants/turnCopy';
import { MoneyText } from '../../MoneyText';
import { PersonaPortrait } from '../brand/PersonaPortrait';

function moneyAria(n) {
  const abs = Math.abs(Math.round(Number(n) || 0)).toLocaleString('ru-RU');
  return `${abs} руб.`;
}

/** Ячейка денег: кнопка в раздел «Капитала», если есть навигация, иначе статичная. */
function MoneyCell({ label, children, ariaLabel, section, onNavigate, className = '', note = null }) {
  const cls = ['mqx-bg-money__cell', className].filter(Boolean).join(' ');
  const body = (
    <>
      <small className="mqx-bg-money__label">{label}</small>
      <b className="mqx-bg-money__value">{children}</b>
      {note}
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

/**
 * Деньги ★ BG-3: персонаж у суммы «На счёте»; ниже доходы и расходы за ход, затем подушка.
 * Без рамок — прямо на поле. Расход нейтрален (ADR-014), доход — изумруд со знаком «+».
 * У подушки вторая строка «не платит расходы» (PR-07); `cushionRisk` — счёт уйдёт в минус, строка красная.
 */
export function MqxFinancePeriodBlock({
  templateKey,
  cash = 0,
  safety = 0,
  cushionPercent = null,
  income = { label: 'Доходы за ход', value: 0 },
  outflow = 0,
  onFlowsNavigate,
  juiceGainActive = false,
  cushionRisk = false,
}) {
  const incomeValue = Math.max(0, Number(income?.value) || 0);
  const outflowValue = Math.max(0, Number(outflow) || 0);
  const cushionLabel = cushionPercent != null ? `Подушка · ${cushionPercent}%` : 'Подушка';

  return (
    <section className="mqx-bg-money" aria-label={FINANCES_OF_TURN} data-onboarding-anchor="finance-flows">
      <h2 className="mqx-bg-sr-only">{FINANCES_OF_TURN}</h2>
      <div
        className={['mqx-bg-money__hero', juiceGainActive && 'mqx-bg-money__hero--gain'].filter(Boolean).join(' ')}
        data-mqx-juice-target="balance"
      >
        <span className="mqx-bg-money__avatar" aria-hidden="true">
          <PersonaPortrait templateKey={templateKey || 'mq_game_basic_v1'} size="pick" />
        </span>
        <div className="mqx-bg-money__cash" role="group" aria-label={`На счёте ${moneyAria(cash)}`}>
          <small className="mqx-bg-money__label">На счёте</small>
          <b className="mqx-bg-money__cash-value">
            <MoneyText value={cash} decimals={0} />
          </b>
        </div>
      </div>

      <div className="mqx-bg-money__grid">
        <MoneyCell
          label={income.label}
          ariaLabel={`${income.label} плюс ${moneyAria(incomeValue)}`}
          section={CAPITAL_FLOWS_SECTION.income}
          onNavigate={onFlowsNavigate}
          className="mqx-bg-money__cell--gain"
        >
          +<MoneyText value={incomeValue} decimals={0} />
        </MoneyCell>
        <MoneyCell
          label="Расходы за ход"
          ariaLabel={`Расходы за ход ${moneyAria(outflowValue)}`}
          section={CAPITAL_FLOWS_SECTION.expense}
          onNavigate={onFlowsNavigate}
        >
          −<MoneyText value={outflowValue} decimals={0} />
        </MoneyCell>
        <MoneyCell
          label={cushionLabel}
          ariaLabel={
            (cushionPercent != null
              ? `Подушка ${moneyAria(safety)}, наполнение ${cushionPercent}% от нормы`
              : `Подушка ${moneyAria(safety)}`) + ', не платит расходы хода'
          }
          note={
            <small
              className={['mqx-bg-money__note', cushionRisk && 'mqx-bg-money__note--risk'].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              не платит расходы
            </small>
          }
        >
          <MoneyText value={safety} decimals={0} />
        </MoneyCell>
      </div>
    </section>
  );
}
