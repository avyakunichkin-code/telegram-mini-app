/** Пустое состояние таблицы / списка в админке. */
export function AdminEmptyState({ children = 'Пока пусто', className = '' }) {
  return <p className={`mq-muted admin-empty-state ${className}`.trim()}>{children}</p>;
}
