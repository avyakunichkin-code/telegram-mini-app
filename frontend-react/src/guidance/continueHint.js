/**
 * Последний абзац «**Нажми «Понятно»** …» в тексте подсказки — подпись под кнопкой «Понятно»,
 * а не часть текста над ней (решение PO 2026-11-02). Тексты курса не меняются: делим при отрисовке.
 */
const CONTINUE_HINT_RE = /^\s*\*\*Нажми «Понятно»\*\*/;

export function splitContinueHint(body) {
  const text = String(body ?? '');
  const cut = text.lastIndexOf('\n\n');
  const last = cut >= 0 ? text.slice(cut + 2) : text;
  if (!CONTINUE_HINT_RE.test(last)) return { main: text, hint: null };
  return { main: cut >= 0 ? text.slice(0, cut).trimEnd() : '', hint: last.trim() };
}
