/**
 * Секция без карточки: заголовок + опциональная ссылка-действие + контент.
 */
export function MqxBlockSection({ title, actionLabel, onAction, children, className = '' }) {
  return (
    <section className={['mqx-block', className].filter(Boolean).join(' ')}>
      <div className="mqx-block__head">
        <div className="mqx-block__title">{title}</div>
        {actionLabel && onAction ? (
          <button type="button" className="mqx-link" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
