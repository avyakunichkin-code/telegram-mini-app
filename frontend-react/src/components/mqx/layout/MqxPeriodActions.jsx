/**
 * Блок «Действия периода» (4 кнопки, «Зарплата» — primary).
 */
export function MqxPeriodActions({
  xpLabel = 'XP +10',
  salaryLabel = 'Зарплата',
  busy = false,
  onSalary,
  onContribute,
  onWithdraw,
  onInvest,
}) {
  return (
    <section className="mqx-period-actions" aria-label="Действия периода">
      <div className="mqx-actions__head">
        <div>
          <h2 className="mqx-card__title" style={{ marginTop: 0 }}>
            Действия периода
          </h2>
          <p className="mqx-card__sub">Управляй денежным потоком</p>
        </div>
        <div className="mqx-xp">{xpLabel}</div>
      </div>

      <div className="mqx-grid2">
        <button
          type="button"
          className="mqx-action mqx-action--primary"
          disabled={busy}
          data-onboarding-anchor="salary"
          title="Получить зарплату за текущий период"
          aria-label="Зарплата"
          onClick={onSalary}
        >
          {salaryLabel}
        </button>
        <button
          type="button"
          className="mqx-action"
          disabled={busy}
          data-onboarding-anchor="cushion"
          title="Перевести деньги в подушку безопасности"
          aria-label="В подушку"
          onClick={onContribute}
        >
          В подушку
        </button>
        <button
          type="button"
          className="mqx-action"
          disabled={busy}
          title="Снять деньги из подушки на счёт"
          aria-label="Снять из подушки"
          onClick={onWithdraw}
        >
          Снять
        </button>
        <button
          type="button"
          className="mqx-action"
          title="Открыть раздел инвестиций"
          aria-label="Инвестировать"
          onClick={onInvest}
        >
          Инвестировать
        </button>
      </div>
    </section>
  );
}
