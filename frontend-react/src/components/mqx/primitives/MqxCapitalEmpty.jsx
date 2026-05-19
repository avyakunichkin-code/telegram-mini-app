/**
 * Пустое состояние внутри раздела «Управление капиталом» — без dashed-рамки, с опциональным CTA.
 */
export function MqxCapitalEmpty({ message, actionLabel, onAction }) {
  return (
    <div className="mqx-capital-empty">
      <p className="mqx-capital-empty__msg">{message}</p>
      {actionLabel && onAction ? (
        <button type="button" className="mqx-capital-empty__cta" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
