/** Прогресс-бар: трек 6px (D), fill emerald-градиент (B+A). */
export function MqxProgress({ value = 0, className = '', 'aria-label': ariaLabel }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={['mqx-progress', className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <div
        className="mqx-progress__fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
