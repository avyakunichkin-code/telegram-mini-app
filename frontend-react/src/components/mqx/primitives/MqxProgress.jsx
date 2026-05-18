/** Прогресс-бар: трек 6px (D), fill emerald-градиент (B+A) или XP (A). */
export function MqxProgress({ value = 0, xp = false, className = '', 'aria-label': ariaLabel }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={['mqx-progress', className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <div
        className={['mqx-progress__fill', xp && 'mqx-progress__fill--xp'].filter(Boolean).join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
