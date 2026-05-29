/**
 * ★ S3 — skeleton loading: `rows` (списки финансов) | `chips` (2×2 дашборд).
 */
export function MqxStateSkeleton({ variant = 'rows', rows = 3, label }) {
  if (variant === 'chips') {
    return (
      <div className="mqx-state-skeleton mqx-state-skeleton--chips" aria-busy="true" aria-label={label || 'Загрузка'}>
        {label ? <p className="mqx-state-skeleton__label">{label}</p> : null}
        <div className="mqx-state-skeleton__chips">
          <div className="mqx-state-skeleton__chip" />
          <div className="mqx-state-skeleton__chip" />
          <div className="mqx-state-skeleton__chip" />
          <div className="mqx-state-skeleton__chip" />
        </div>
      </div>
    );
  }

  return (
    <div className="mqx-state-skeleton mqx-state-skeleton--rows" aria-busy="true" aria-label={label || 'Загрузка списка'}>
      {label ? <p className="mqx-state-skeleton__label">{label}</p> : null}
      <div className="mqx-state-skeleton__rows">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="mqx-state-skeleton__row" />
        ))}
      </div>
    </div>
  );
}
