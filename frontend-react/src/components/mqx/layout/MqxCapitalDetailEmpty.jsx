/** Пустое состояние в «Детали»: подсказка + CTA на вкладку «Действия». */
export function MqxCapitalDetailEmpty({ children, actionLabel, onAction }) {
  return (
    <div className="mqx-cap-detail-empty">
      <p className="mqx-cap-detail-empty__text">{children}</p>
      {actionLabel && onAction ? (
        <div className="mqx-cap-detail-empty__actions">
          <button type="button" className="mqx-cap-add-cta" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
