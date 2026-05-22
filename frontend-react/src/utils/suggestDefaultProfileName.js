const DEFAULT_PREFIX = 'Моя игра - ';
const NUMBERED_PATTERN = /^моя игра\s*-\s*(\d+)\s*$/i;

/**
 * Следующее свободное имя слота: «Моя игра - N» (N = max среди таких имён + 1).
 * @param {Array<{ name?: string }>} profiles
 */
export function suggestDefaultProfileName(profiles) {
  let maxN = 0;
  for (const p of profiles || []) {
    const raw = String(p?.name ?? '').trim();
    const m = raw.match(NUMBERED_PATTERN);
    if (m) maxN = Math.max(maxN, Number.parseInt(m[1], 10) || 0);
  }
  return `${DEFAULT_PREFIX}${maxN + 1}`;
}
