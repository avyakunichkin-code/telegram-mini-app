/** Денежные POST, где backend уже читает Idempotency-Key через run_idempotent. */
const IDEMPOTENT_MONEY_POSTS = new Set([
  '/api/game/period/contribute-to-safety-fund',
  '/api/game/period/withdraw-from-safety-fund',
  '/api/game/period/treat-self',
  '/api/invest/deposit/open',
  '/api/invest/bond/buy',
  '/api/insurance/buy',
]);

function normalizePath(endpoint) {
  return String(endpoint || '').split('?')[0];
}

/**
 * Серверный ключ уже есть у close / salary / choose — клиентский заголовок там не обязателен.
 * Два перевода в подушку из двух вкладок остаются двумя переводами.
 */
export function shouldAttachIdempotencyKey(method, endpoint) {
  if (String(method || 'GET').toUpperCase() !== 'POST') return false;
  const path = normalizePath(endpoint);
  if (path === '/api/game/time/next') return false;
  if (path === '/api/game/period/claim-salary') return false;
  if (/^\/api\/game\/events\/\d+\/choose$/.test(path)) return false;
  return IDEMPOTENT_MONEY_POSTS.has(path);
}

export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
