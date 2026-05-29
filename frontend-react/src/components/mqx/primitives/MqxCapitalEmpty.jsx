import { IconMetricCoins } from '../icons/FinanceMetricIcons';

/**
 * Пустое состояние в разделе капитала (★ S1 C′): inline, иконка + CTA, без серой подложки.
 * @param {string} message — для a11y (visually-hidden), не billboard
 */
export function MqxCapitalEmpty({
  message,
  actionLabel,
  onAction,
  icon: Icon = IconMetricCoins,
}) {
  return (
    <div className="mqx-capital-empty mqx-capital-empty--inline" role="status" aria-label={message}>
      <div className="mqx-capital-empty__icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="mqx-capital-empty__cta" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      {message ? <span className="visually-hidden">{message}</span> : null}
    </div>
  );
}
