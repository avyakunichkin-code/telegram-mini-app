/**
 * Прогресс-бар: трек 6px (D), fill emerald-градиент (B+A).
 * `tone` (BG-1): gain | risk — плоская заливка по роли цвета ADR-014 (`data-tone`).
 */
export function MqxProgress({ value = 0, className = '', tone, 'aria-label': ariaLabel }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={['mqx-progress', className].filter(Boolean).join(' ')} data-tone={tone} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <div
        className="mqx-progress__fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
