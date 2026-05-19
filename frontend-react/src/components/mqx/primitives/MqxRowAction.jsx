/** Компактное действие в строке: + (add) или − (remove). Канон B — см. design-lab/row-actions. */
export function MqxRowAction({
  variant = 'remove',
  ariaLabel,
  onClick,
  disabled = false,
  className = '',
}) {
  const isAdd = variant === 'add';
  const label = isAdd ? '+' : '−';

  return (
    <button
      type="button"
      className={[
        'mqx-row-action',
        isAdd ? 'mqx-row-action--add' : 'mqx-row-action--remove',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="mqx-row-action__glyph" aria-hidden>
        {label}
      </span>
    </button>
  );
}
