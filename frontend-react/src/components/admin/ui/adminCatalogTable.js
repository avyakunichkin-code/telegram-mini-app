/** Форматирование ячейки каталога и эвристика сортировки. */
export function formatCatalogCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

const NUMERIC_KEYS = new Set([
  'id',
  'sort_order',
  'weight',
  'event_tier',
  'cooldown_periods',
  'difficulty_rank',
  'base_monthly_lifestyle_expense',
  'total_debt',
  'annual_rate_percent',
  'asset_value',
  'monthly_maintenance_cost',
  'monthly_income',
]);

export function catalogColumnSortable(key) {
  if (NUMERIC_KEYS.has(key)) return true;
  if (key === 'is_active' || key === 'mandatory') return true;
  return ['template_key', 'key', 'title', 'mode', 'kind', 'category', 'content_class'].includes(key);
}

export function catalogColumnSortValue(row, key) {
  const v = row[key];
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  return String(v);
}
