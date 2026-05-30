function ActionChipIcon({ accent, children }) {
  return (
    <span className={`mqx-action-chip__icon ${accent}`} aria-hidden="true">
      {children}
    </span>
  );
}

function ActionChip({ label, sub, icon, disabled, className = '', ...buttonProps }) {
  const cls = ['mqx-action-chip', className, disabled && 'is-disabled'].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} disabled={disabled} {...buttonProps}>
      {icon}
      <span className="mqx-action-chip__body">
        <span className="mqx-action-chip__label">{label}</span>
        {sub ? <span className="mqx-action-chip__sub mqx-action-chip__sub--phrase">{sub}</span> : null}
      </span>
    </button>
  );
}

/** Блок «Действия периода» — chip 2×2 (★ period-actions-round). */
export function MqxPeriodActions({
  salaryDisabled = false,
  salaryCelebrate = false,
  busy = false,
  activeMoneyMode = null,
  onSalary,
  onContribute,
  onWithdraw,
  onInvest,
}) {
  const salaryBusy = busy || salaryDisabled;
  const salaryClass = [
    'mqx-action-chip--salary',
    'mqx-action-chip--primary',
    salaryCelebrate ? 'mqx-juice-chip--celebrate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="mqx-period-actions mqx-period-actions--chips" aria-label="Действия периода">
      <h2 className="mqx-finance-static__title">Действия периода</h2>
      <div className="mqx-action-chips">
        <ActionChip
          label="Зарплата"
          sub="получить"
          className={salaryClass}
          disabled={salaryBusy}
          data-onboarding-anchor="salary"
          title={
            salaryDisabled
              ? 'Зарплата за этот период уже получена или недоступна'
              : 'Получить зарплату за текущий период'
          }
          aria-label="Зарплата"
          onClick={onSalary}
          icon={
            <ActionChipIcon accent="mqx-accent--violet">
              <svg viewBox="0 0 24 24">
                <path d="M12 2v4" />
                <path d="M8 6h8" />
                <path d="M6 10h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8Z" />
                <path d="M9 14h6" />
              </svg>
            </ActionChipIcon>
          }
        />

        <ActionChip
          label="Вложить"
          sub="депозиты/облигации"
          disabled={busy || !onInvest}
          title="Открыть раздел инвестиций"
          aria-label="Вложить"
          onClick={onInvest}
          icon={
            <ActionChipIcon accent="mqx-accent--amber">
              <svg viewBox="0 0 24 24">
                <path d="M4 19V5" />
                <path d="M4 19h16" />
                <path d="M7 15l4-4 3 3 5-6" />
              </svg>
            </ActionChipIcon>
          }
        />

        <ActionChip
          label="Пополнить"
          sub="подушку"
          disabled={busy}
          className={activeMoneyMode === 'in' ? 'mqx-action-chip--active-mode' : ''}
          data-onboarding-anchor="cushion"
          data-money-trigger="in"
          title="Перевести деньги с карты в подушку"
          aria-label="Пополнить подушку"
          onClick={onContribute}
          icon={
            <ActionChipIcon accent="mqx-accent--emerald">
              <svg viewBox="0 0 24 24">
                <path d="M12 19V5" />
                <path d="M19 12 12 19 5 12" />
              </svg>
            </ActionChipIcon>
          }
        />

        <ActionChip
          label="Снять"
          sub="с подушки"
          disabled={busy}
          className={activeMoneyMode === 'out' ? 'mqx-action-chip--active-mode' : ''}
          data-money-trigger="out"
          title="Снять деньги с подушки на счёт"
          aria-label="Снять с подушки"
          onClick={onWithdraw}
          icon={
            <ActionChipIcon accent="mqx-accent--sky">
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14" />
                <path d="M8 9l4-4 4 4" />
              </svg>
            </ActionChipIcon>
          }
        />
      </div>
    </section>
  );
}
