import { createPortal } from 'react-dom';

import { useMqxSheetScrollLock } from '../hooks/useMqxSheetScrollLock';

const DEFAULT_SHEET_CLASS = 'mqx-sheet--amount mqx-sheet--capital';

/** Универсальный bottom sheet (финансы, подушка на дашборде). */
export function MqxCapitalSheet({
  open,
  title,
  subtitle,
  onClose,
  busy = false,
  children,
  portal = false,
  lockScroll = false,
  titleId = 'mqx-capital-sheet-title',
  sheetClassName = DEFAULT_SHEET_CLASS,
}) {
  useMqxSheetScrollLock(open && lockScroll);

  if (!open) return null;

  const sheet = (
    <div
      className={['mqx-sheet-root', portal && 'mqx-sheet-root--portal'].filter(Boolean).join(' ')}
      role="presentation"
    >
      <button
        type="button"
        className="mqx-sheet-scrim"
        aria-label="Закрыть"
        onClick={busy ? undefined : onClose}
      />
      <section
        className={['mqx-sheet', sheetClassName].filter(Boolean).join(' ')}
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
            {title}
          </h2>
          {subtitle ? <p className="mqx-sheet__sub">{subtitle}</p> : null}
        </header>
        <div className="mqx-sheet__body mqx-sheet__body--scroll">{children}</div>
      </section>
    </div>
  );

  if (portal) return createPortal(sheet, document.body);
  return sheet;
}
