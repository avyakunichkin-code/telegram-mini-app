/**
 * Подсчёт стилевого долга styles/mqx (аудит 2026-10-25, улучшение 7): цветовые литералы и шрифты < 12 px.
 * Общий для check-style-discipline (добавленные строки) и check-mqx-ratchet (счётчики по файлам).
 */

/** Запасной цвет переменной темы Telegram: вне TMA переменной нет, работает именно он — не долг. */
const TG_FALLBACK = /var\(--tg-theme-[a-z0-9-]+,\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))\)/gi;

/** Цветовые литералы (HEX и rgb/rgba) в строке CSS, кроме запасных цветов темы Telegram и комментариев. */
export function colorLiterals(line) {
  const code = line.replace(/\/\*.*?\*\//g, '').replace(TG_FALLBACK, '');
  return code.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) || [];
}

/** Шрифт меньше 12 px: литерал 9–11.9px или токены --mq-fs-micro (10) / --mq-fs-small (11). */
export function fontUnder12(line) {
  const decl = line.match(/font-size\s*:\s*([^;]+)/i);
  if (!decl) return false;
  const value = decl[1];
  if (/var\(--mq-fs-(micro|small)\b/.test(value)) return true;
  const px = value.match(/^\s*(\d+(?:\.\d+)?)px\b/);
  return Boolean(px && Number(px[1]) < 12);
}

/** @returns {{ colors: number, fontUnder12: number }} */
export function countDebt(css) {
  let colors = 0;
  let fonts = 0;
  for (const line of css.split(/\r?\n/)) {
    colors += colorLiterals(line).length;
    if (fontUnder12(line)) fonts += 1;
  }
  return { colors, fontUnder12: fonts };
}
