import { useMemo } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { AdminEmptyState } from './AdminEmptyState';

/**
 * @typedef {object} AdminColumnDef
 * @property {string} key
 * @property {string} label
 * @property {(row: object) => import('react').ReactNode} render
 * @property {boolean} [sortable]
 * @property {(row: object) => string | number} [sortValue]
 */

/**
 * Таблица на TanStack Table: sticky header, опциональная сортировка по колонке.
 */
export function AdminDataTable({
  columns,
  rows,
  highlightId,
  onRowClick,
  emptyText = 'Пока пусто',
  maxHeight,
}) {
  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.label,
        enableSorting: Boolean(col.sortable),
        accessorFn: (row) => {
          if (col.sortValue) return col.sortValue(row);
          const rendered = col.render(row);
          if (typeof rendered === 'string' || typeof rendered === 'number') return rendered;
          return row[col.key] ?? '';
        },
        cell: ({ row }) => col.render(row.original),
      })),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!rows.length) {
    return <AdminEmptyState>{emptyText}</AdminEmptyState>;
  }

  const wrapStyle = maxHeight ? { maxHeight } : undefined;

  return (
    <div className="admin-data-table__wrap admin-watchtower__table-wrap" style={wrapStyle}>
      <table className="admin-watchtower__table admin-data-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id}>
                  {header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="admin-data-table__sort-btn"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="admin-data-table__sort-icon" aria-hidden>
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted()] ?? ' ⇅'}
                      </span>
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((tableRow) => {
            const row = tableRow.original;
            const highlighted = highlightId != null && row._id === highlightId;
            return (
              <tr
                key={row._key ?? tableRow.id}
                className={[
                  highlighted ? 'admin-watchtower__row--highlight' : null,
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
                {tableRow.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
