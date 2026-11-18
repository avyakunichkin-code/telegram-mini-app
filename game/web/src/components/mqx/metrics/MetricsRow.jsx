/** Обёртка inline-метрик (единый отступ и role=list). */
export function MetricsRow({ className = '', children }) {
  return (
    <div className={`mqx-asset-metrics-inline${className ? ` ${className}` : ''}`} role="list">
      {children}
    </div>
  );
}
