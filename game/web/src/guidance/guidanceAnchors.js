/** beat_id curriculum → data-onboarding-anchor на дашборде */
const BEAT_TO_ANCHOR = {
  p1_period: 'hero',
  p1_flows: 'finance-flows',
  p1_salary: 'salary',
  p1_cushion: 'cushion',
  p1_close: 'next_period',
  p2_new_month: 'hero',
  t_events_intro: 'events',
  t_needs: 'needs',
};

export const GUIDANCE_ANCHOR_FOCUS_CLASS = 'mqx-onboarding-anchor--focus';

export function getGuidanceAnchorForBeat(beatId) {
  if (!beatId) return null;
  return BEAT_TO_ANCHOR[String(beatId)] ?? null;
}

/**
 * Сколько px снизу scroll-viewport перекрывает guidance strip (tab bar вне скролла).
 * @param {number} stripHeightPx — высота полоски подсказки
 * @param {number} [extraPad=16]
 */
export function getGuidanceBottomReservePx(stripHeightPx, extraPad = 16) {
  const strip = Number(stripHeightPx) || 0;
  const pad = Number(extraPad) || 16;
  return strip + pad;
}

/**
 * Подкрутить scrollTop, если якорь перекрыт нижней полосой или выше видимой области.
 */
export function scrollGuidanceAnchorIntoView({ scrollEl, target, bottomReservePx, stripHeightPx }) {
  if (!target) return;

  const reserve =
    stripHeightPx != null
      ? getGuidanceBottomReservePx(stripHeightPx)
      : Math.max(80, Number(bottomReservePx) || 120);
  const targetRect = target.getBoundingClientRect();

  if (scrollEl) {
    const parentRect = scrollEl.getBoundingClientRect();
    const topLimit = parentRect.top + 12;
    const bottomLimit = parentRect.bottom - reserve;

    if (targetRect.top >= topLimit && targetRect.bottom <= bottomLimit) {
      return;
    }

    const offsetTop = targetRect.top - parentRect.top + scrollEl.scrollTop;
    const viewH = scrollEl.clientHeight;
    const visibleBottom = bottomLimit - parentRect.top;
    const goal = offsetTop - Math.max(48, (viewH - visibleBottom) * 0.25);
    scrollEl.scrollTo({ top: Math.max(0, goal), behavior: 'smooth' });
    return;
  }

  const maxBottom = window.innerHeight - reserve;
  if (targetRect.bottom > maxBottom || targetRect.top < 12) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
