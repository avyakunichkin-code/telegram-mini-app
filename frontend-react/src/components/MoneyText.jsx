/**
 * Денежный формат с tabular nums и неразрывным пробелом перед единицей.
 */
export function MoneyText({ value, decimals = 2, unit = '₽', className = '' }) {
  const n = Number(value);
  const text = Number.isFinite(n)
    ? n.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : '—';

  return (
    <span className={`mq-money ${className}`}>
      <span className="mq-money__value">{text}</span>
      <span className="mq-money__unit">&nbsp;{unit}</span>
    </span>
  );
}
