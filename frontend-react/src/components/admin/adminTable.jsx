/** Общая таблица Watchtower / каталогов. */
export function formatAdminDt(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return String(value);
  }
}

export function AdminTable({ columns, rows, highlightId, onRowClick, emptyText = 'Пока пусто' }) {
  if (!rows.length) {
    return <p className="mq-muted">{emptyText}</p>;
  }
  return (
    <div className="admin-watchtower__table-wrap">
      <table className="admin-watchtower__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row._key}
              className={[
                highlightId != null && row._id === highlightId
                  ? 'admin-watchtower__row--highlight'
                  : null,
                onRowClick ? 'admin-watchtower__row--clickable' : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
