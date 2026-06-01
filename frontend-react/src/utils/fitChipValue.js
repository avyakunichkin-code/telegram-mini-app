/** Уменьшает font-size, пока значение не влезает в chip (без переноса). */
export function fitChipValueElement(el, { minPx = 9, maxPx = 13, stepPx = 0.5 } = {}) {
  if (!el?.parentElement) return;
  let size = maxPx;
  el.style.fontSize = `${size}px`;
  const maxW = el.parentElement.clientWidth;
  while (el.scrollWidth > maxW && size > minPx) {
    size -= stepPx;
    el.style.fontSize = `${size}px`;
  }
}

export function fitChipValuesIn(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('.mqx-finance-chip__value').forEach((el) => {
    fitChipValueElement(el);
  });
}
