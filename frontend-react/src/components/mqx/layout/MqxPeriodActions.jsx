import { useId } from 'react';

import { ACTIONS_OF_TURN } from '../../../constants/turnCopy';
import { MoneyText } from '../../MoneyText';

function ActionButton({ label, icon, className = '', ...buttonProps }) {
  return (
    <button type="button" className={['mqx-bg-btn', 'mqx-bg-act', className].filter(Boolean).join(' ')} {...buttonProps}>
      <span className="mqx-bg-act__ico" aria-hidden="true">
        {icon}
      </span>
      <span className="mqx-bg-act__label">{label}</span>
    </button>
  );
}

function Glyph({ d }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

const PLUS = ['M12 5v14', 'M5 12h14'];
const MINUS = ['M5 12h14'];
const GROWTH = ['M3 17l6-6 4 4 8-8', 'M14 7h7v7'];

/**
 * Кнопка зарплаты ★ BG-3: пока не забрана — главная золотая на всю ширину с суммой;
 * после выплаты — спокойная пунктирная строка «Зарплата получена».
 */
function SalaryButton({ hot, claimed, celebrate, amount, disabled, onClick }) {
  const cls = [
    'mqx-bg-btn',
    'mqx-bg-salary',
    hot && !claimed ? 'mqx-bg-salary--hot' : 'mqx-bg-salary--quiet',
    celebrate ? 'mqx-juice-chip--celebrate' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const label = claimed ? 'Зарплата получена' : 'Зарплата';
  const showAmount = !claimed && Number(amount) > 0;

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      data-onboarding-anchor="salary"
      title={claimed ? 'Зарплата за этот ход уже получена' : hot ? 'Получить зарплату за текущий ход' : 'Зарплата в этом ходе недоступна'}
      aria-label={claimed ? 'Зарплата, уже получена' : hot ? 'Зарплата, получить' : 'Зарплата, недоступна'}
      onClick={onClick}
    >
      <span className="mqx-bg-coin mqx-bg-coin--salary" aria-hidden="true">
        ₽
      </span>
      <span className="mqx-bg-salary__label">{label}</span>
      {showAmount ? (
        <span className="mqx-bg-salary__sum">
          +<MoneyText value={amount} decimals={0} />
        </span>
      ) : claimed ? (
        <span className="mqx-bg-salary__sum" aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
}

/**
 * Действия хода ★ BG-3 (design-lab/board-game/frames-round, вариант E):
 * «Зарплата» — главная строка; «В подушку», «Из подушки», «Вложить» — залитые фишки в ряд.
 */
export function MqxPeriodActions({
  salaryDisabled = false,
  salaryHot = false,
  salaryClaimed = false,
  salaryCelebrate = false,
  salaryAmount = 0,
  busy = false,
  activeMoneyMode = null,
  onSalary,
  onContribute,
  onWithdraw,
  onInvest,
}) {
  const titleId = useId();

  return (
    <section className="mqx-bg-acts" aria-labelledby={titleId}>
      <h2 id={titleId} className="mqx-bg-sec-title">
        {ACTIONS_OF_TURN}
      </h2>
      <SalaryButton
        hot={salaryHot}
        claimed={salaryClaimed}
        celebrate={salaryCelebrate}
        amount={salaryAmount}
        disabled={busy || salaryDisabled}
        onClick={onSalary}
      />
      <div className="mqx-bg-acts__row">
        <ActionButton
          label="В подушку"
          disabled={busy}
          className={activeMoneyMode === 'in' ? 'mqx-bg-act--active' : ''}
          data-onboarding-anchor="cushion"
          data-money-trigger="in"
          title="Перевести деньги со счёта в подушку"
          aria-label="Положить в подушку"
          onClick={onContribute}
          icon={<Glyph d={PLUS} />}
        />

        <ActionButton
          label="Из подушки"
          disabled={busy}
          className={activeMoneyMode === 'out' ? 'mqx-bg-act--active' : ''}
          data-money-trigger="out"
          title="Снять деньги с подушки на счёт"
          aria-label="Снять из подушки"
          onClick={onWithdraw}
          icon={<Glyph d={MINUS} />}
        />

        <ActionButton
          label="Вложить"
          disabled={busy || !onInvest}
          title="Открыть раздел инвестиций"
          aria-label="Вложить"
          onClick={onInvest}
          icon={<Glyph d={GROWTH} />}
        />
      </div>
    </section>
  );
}
