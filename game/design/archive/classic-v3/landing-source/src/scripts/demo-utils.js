export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatMoney(amount, lang) {
  const n = Math.round(amount);
  if (lang === 'en') {
    return `${n.toLocaleString('en-US')} ₽`;
  }
  return `${n.toLocaleString('ru-RU')} ₽`;
}

/** Плавное изменение числа на элементе */
export async function animateMoney(el, from, to, lang, durationMs = 700) {
  const start = performance.now();
  return new Promise((resolve) => {
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const value = from + (to - from) * eased;
      el.textContent = formatMoney(value, lang);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

export function formatTimer(totalSec) {
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
