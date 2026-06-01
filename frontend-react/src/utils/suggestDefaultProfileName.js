const BASE_NAME = 'Моя игра';
const LEGACY_NUMBERED = /^моя игра\s*-\s*(\d+)\s*$/i;
const INDEXED = /^моя игра\s+(\d+)\s*$/i;

function parseIndexedName(raw) {
  let m = raw.match(INDEXED);
  if (m) return Number.parseInt(m[1], 10) || 0;
  m = raw.match(LEGACY_NUMBERED);
  if (m) return Number.parseInt(m[1], 10) || 0;
  return 0;
}

/**
 * Название игры по умолчанию: «Моя игра N» (N растёт с числом сохранений и уже занятыми индексами).
 * @param {Array<{ name?: string, save_kind?: string }>} profiles
 */
export function suggestDefaultProfileName(profiles) {
  const list = profiles || [];
  let maxN = 0;
  for (const p of list) {
    const raw = String(p?.name ?? '').trim();
    maxN = Math.max(maxN, parseIndexedName(raw));
  }
  const gameCount = list.filter((p) => (p?.save_kind || 'game') === 'game').length;
  const next = Math.max(maxN, gameCount) + 1;
  return `${BASE_NAME} ${next}`;
}
