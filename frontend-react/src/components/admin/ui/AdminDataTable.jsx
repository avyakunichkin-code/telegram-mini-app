import { useMemo, useRef } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AdminEmptyState } from './AdminEmptyState';

const DEFAULT_ROW_HEIGHT = 44;
const DEFAULT_VIRTUAL_THRESHOLD = 80;

/**
 * Таблица на TanStack Table: sticky header, сортировка, виртуализация при большом списке.
 */
export function AdminDataTable({
  columns,
  rows,
  highlightId,
  onRowClick,
  emptyText = 'Пока пусто',
  maxHeight,
  virtualizeThreshold = DEFAULT_VIRTUAL_THRESHOLD,
  getRowRef,
  getRowClassName,
}) {
  const parentRef = useRef(null);

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

  const modelRows = table.getRowModel().rows;
  const colCount = table.getVisibleFlatColumns().length;
  const useVirtual = modelRows.length >= virtualizeThreshold && Boolean(maxHeight);

  const rowVirtualizer = useVirtualizer({
    count: modelRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: 12,
    enabled: useVirtual,
  });

  if (!rows.length) {
    return <AdminEmptyState>{emptyText}</AdminEmptyState>;
  }

  const wrapStyle = maxHeight ? { maxHeight } : undefined;

  const renderBodyRow = (tableRow) => {
    const row = tableRow.original;
    const highlighted = highlightId != null && row._id === highlightId;
    const extraClass = getRowClassName?.(row);
    const rowRef = getRowRef?.(row);

    return (
      <tr
        key={row._key ?? tableRow.id}
        ref={rowRef}
        className={[
          highlighted ? 'admin-watchtower__row--highlight' : null,
          onRowClick ? 'admin-watchtower__row--clickable' : null,
          extraClass,
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
  };

  let bodyRows;
  if (useVirtual) {
    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
    const paddingBottom =
      virtualRows.length > 0
        ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
        : 0;

    bodyRows = (
      <>
        {paddingTop > 0 ? (
          <tr className="admin-data-table__spacer" aria-hidden>
            <td colSpan={colCount} style={{ height: paddingTop, padding: 0, border: 'none' }} />
          </tr>
        ) : null}
        {virtualRows.map((vRow) => renderBodyRow(modelRows[vRow.index]))}
        {paddingBottom > 0 ? (
          <tr className="admin-data-table__spacer" aria-hidden>
            <td colSpan={colCount} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
          </tr>
        ) : null}
      </>
    );
  } else {
    bodyRows = modelRows.map((tableRow) => renderBodyRow(tableRow));
  }

  return (
    <div
      ref={parentRef}
      className="admin-data-table__wrap admin-watchtower__table-wrap"
      style={wrapStyle}
    >
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
        <tbody>{bodyRows}</tbody>
      </table>
    </div>
  );
}
