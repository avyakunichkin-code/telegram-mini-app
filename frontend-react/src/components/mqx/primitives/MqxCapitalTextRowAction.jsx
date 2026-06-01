/** Компактная текстовая кнопка в строке позиции (lab cap-row-action). */
export function MqxCapitalTextRowAction({
  children,
  variant = 'close',
  onClick,
  disabled = false,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      className={`mqx-cap-row-action mqx-cap-row-action--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
    >
      {children}
    </button>
  );
}
