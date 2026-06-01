/**
 * Логин для API при регистрации без отдельного поля username (локальная часть email).
 */
export function deriveUsernameFromEmail(email) {
  const trimmed = (email ?? '').trim().toLowerCase();
  const local = trimmed.split('@')[0] ?? '';
  let base = local.replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
  if (base.length < 2) {
    const tail = trimmed.replace(/[^a-z0-9]/g, '').slice(0, 8);
    base = tail.length >= 2 ? `u_${tail}` : 'mqplayer';
  }
  return base.slice(0, 50);
}
