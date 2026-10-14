import { useId } from 'react';

import { ACTIONS_OF_TURN } from '../../../constants/turnCopy';

function ActionButton({ label, icon, className = '', ...buttonProps }) {
  return (
    <button type="button" className={['mqx-bg-btn', 'mqx-bg-act', className].filter(Boolean).join(' ')} {...buttonProps}>
      {icon}
      <span className="mqx-bg-act__label">{label}</span>
    </button>
  );
}

function ActIcon({ children }) {
  return (
    <span className="mqx-bg-act__ico" aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Действия хода ★ BG-1: 4 кнопки в ряд. «Зарплата» — монета и золотая подсветка, пока не забрана.
 * Подписи «Пополнить» / «Снять» — открытая задача, здесь не меняются.
 */
export function MqxPeriodActions({
  salaryDisabled = false,
  salaryHot = false,
  salaryCelebrate = false,
  busy = false,
  activeMoneyMode = null,
  onSalary,
  onContribute,
  onWithdraw,
  onInvest,
}) {
  const titleId = useId();
  const salaryClass = [
    salaryHot && !salaryDisabled ? 'mqx-bg-act--hot' : '',
    salaryCelebrate ? 'mqx-juice-chip--celebrate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="mqx-bg-acts" aria-labelledby={titleId}>
      <h2 id={titleId} className="mqx-bg-sr-only">
        {ACTIONS_OF_TURN}
      </h2>
      <div className="mqx-bg-acts__row">
        <ActionButton
          label="Зарплата"
          className={salaryClass}
          disabled={busy || salaryDisabled}
          data-onboarding-anchor="salary"
          title={
            salaryDisabled
              ? 'Зарплата за этот ход уже получена или недоступна'
              : 'Получить зарплату за текущий ход'
          }
          aria-label={salaryDisabled ? 'Зарплата, уже получена' : 'Зарплата, получить'}
          onClick={onSalary}
          icon={
            <span className="mqx-bg-coin mqx-bg-coin--act" aria-hidden="true">
              ₽
            </span>
          }
        />

        <ActionButton
          label="Вложить"
          disabled={busy || !onInvest}
          title="Открыть раздел инвестиций"
          aria-label="Вложить"
          onClick={onInvest}
          icon={<ActIcon>↗</ActIcon>}
        />

        <ActionButton
          label="Пополнить"
          disabled={busy}
          className={activeMoneyMode === 'in' ? 'mqx-bg-act--active' : ''}
          data-onboarding-anchor="cushion"
          data-money-trigger="in"
          title="Перевести деньги с карты в подушку"
          aria-label="Пополнить подушку"
          onClick={onContribute}
          icon={<ActIcon>+</ActIcon>}
        />

        <ActionButton
          label="Снять"
          disabled={busy}
          className={activeMoneyMode === 'out' ? 'mqx-bg-act--active' : ''}
          data-money-trigger="out"
          title="Снять деньги с подушки на счёт"
          aria-label="Снять с подушки"
          onClick={onWithdraw}
          icon={<ActIcon>−</ActIcon>}
        />
      </div>
    </section>
  );
}
