import { IconMetricTrash } from '../icons/FinanceMetricIcons';

/**
 * Компактное действие в строке: + (add) или − / корзина (remove).
 * Канон B — см. design-lab/row-actions; removeVisual: `trash` (по умолчанию, F2) | `minus` (F1).
 */
export function MqxRowAction({
  variant = 'remove',
  removeVisual = 'trash',
  ariaLabel,
  onClick,
  disabled = false,
  className = '',
}) {
  const isAdd = variant === 'add';
  const label = isAdd ? '+' : '−';
  const showTrash = !isAdd && removeVisual === 'trash';

  return (
    <button
      type="button"
      className={[
        'mqx-row-action',
        isAdd ? 'mqx-row-action--add' : 'mqx-row-action--remove',
        showTrash ? 'mqx-row-action--remove-icon' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="mqx-row-action__glyph" aria-hidden>
        {isAdd ? label : showTrash ? <IconMetricTrash size={18} /> : label}
      </span>
    </button>
  );
}
