/**
 * Сетка KPI для Watchtower и дашбордов ops.
 * @param {{ items: Array<{ key: string, label: string, value: React.ReactNode, sub?: React.ReactNode }>, className?: string, variant?: 'default' | 'summary' }} props
 */
export function AdminKpiGrid({ items, className = '', variant = 'default' }) {
  if (!items?.length) return null;
  const rowClass = [
    'admin-watchtower__kpi-row',
    variant === 'summary' ? 'admin-watchtower__kpi-row--summary' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass}>
      {items.map((item) => (
        <div key={item.key} className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">{item.label}</span>
          <strong>{item.value}</strong>
          {item.sub != null && item.sub !== '' ? (
            <span className="admin-watchtower__kpi-sub">{item.sub}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
