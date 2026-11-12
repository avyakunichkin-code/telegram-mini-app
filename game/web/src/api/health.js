import { getApiBase } from './client.js';

const DEFAULT_TIMEOUT_MS = 40_000;

/**
 * Пинг /api/health — «разбудить» Render и дождаться ответа.
 * @returns {Promise<{ ok: boolean, skipped?: boolean, status?: number, elapsedMs: number }>}
 */
export async function wakeRemoteApi({ timeoutMs = DEFAULT_TIMEOUT_MS, signal: outerSignal } = {}) {
  const base = getApiBase();
  const started = Date.now();
  if (!base) {
    return { ok: true, skipped: true, elapsedMs: 0 };
  }

  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  outerSignal?.addEventListener('abort', onOuterAbort);

  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return {
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - started,
    };
  } catch {
    return { ok: false, elapsedMs: Date.now() - started };
  } finally {
    window.clearTimeout(timer);
    outerSignal?.removeEventListener('abort', onOuterAbort);
  }
}
