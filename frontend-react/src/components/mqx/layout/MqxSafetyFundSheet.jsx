import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { SafetyFundActionForm } from '../../SafetyFundActionForm';

const SHEET_COPY = {
  in: {
    title: 'Пополнить подушку',
    subtitle: 'Перевод со счёта в фин.подушку — запас на неожиданные расходы.',
    submitLabel: 'Перевести в подушку',
  },
  out: {
    title: 'Снять с подушки',
    subtitle: 'Перевод с подушки на счёт для трат в этом периоде.',
    submitLabel: 'Снять на счёт',
  },
};

/** Bottom sheet: пополнение / снятие (режим задаётся кнопкой на дашборде). */
export function MqxSafetyFundSheet({
  open,
  mode,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  busy = false,
  cashBalance = 0,
  safetyBalance = 0,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const root = document.getElementById('root');
    const prevBody = body.style.overflow;
    const prevRoot = root?.style.overflow ?? '';
    body.style.overflow = 'hidden';
    if (root) root.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, [open]);

  if (!open) return null;

  const isIn = mode === 'in';
  const copy = isIn ? SHEET_COPY.in : SHEET_COPY.out;
  const maxAmount = isIn
    ? Math.max(0, Math.floor(Number(cashBalance) || 0))
    : Math.max(0, Math.floor(Number(safetyBalance) || 0));
  const titleId = 'mqx-safety-sheet-title';

  const sheet = (
    <div className="mqx-sheet-root mqx-sheet-root--portal" role="presentation">
      <button
        type="button"
        className="mqx-sheet-scrim"
        aria-label="Закрыть"
        onClick={busy ? undefined : onClose}
      />
      <section
        className="mqx-sheet mqx-sheet--capital"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="mqx-sheet__head">
          <button
            type="button"
            className="mqx-sheet__close"
            onClick={busy ? undefined : onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
          <h2 id={titleId} className="mqx-sheet__title">
            {copy.title}
          </h2>
          <p className="mqx-sheet__sub">{copy.subtitle}</p>
        </header>
        <div className="mqx-sheet__body mqx-sheet__body--scroll">
          <SafetyFundActionForm
            mode={mode}
            amount={amount}
            maxAmount={maxAmount}
            onAmountChange={onAmountChange}
            onSubmit={onSubmit}
            submitLabel={copy.submitLabel}
            busy={busy}
            autoFocus
            embedded
          />
        </div>
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
}
