/** Универсальный bottom sheet для действий на странице «Финансы». */
export function MqxCapitalSheet({ open, title, subtitle, onClose, busy = false, children }) {
  if (!open) return null;

  const titleId = 'mqx-capital-sheet-title';

  return (
    <div className="mqx-sheet-root" role="presentation">
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
        <div className="mqx-sheet__body">{children}</div>
      </section>
    </div>
  );
}
