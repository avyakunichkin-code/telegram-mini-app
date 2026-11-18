/**
 * Превращает значение в безопасный для React текстовый поток (не объект как child).
 */
export function asSafeReactText(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  if (typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) {
    try {
      return value
        .map((v) =>
          typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v),
        )
        .join(' ');
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object') {
    if (typeof value.msg === 'string') return value.msg;
    if (typeof value.message === 'string') return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
