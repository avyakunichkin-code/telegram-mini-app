/** beat_id curriculum → data-onboarding-anchor на дашборде */
const BEAT_TO_ANCHOR = {
  p1_period: 'hero',
  p1_salary: 'salary',
  p1_cushion: 'cushion',
  p1_close: 'next_period',
  p2_events_intro: 'events',
  p3_needs: 'needs',
};

export const GUIDANCE_ANCHOR_FOCUS_CLASS = 'mqx-onboarding-anchor--focus';

export function getGuidanceAnchorForBeat(beatId) {
  if (!beatId) return null;
  return BEAT_TO_ANCHOR[String(beatId)] ?? null;
}

/**
 * Сколько px снизу viewport «съедают» tab bar + guidance strip (для scrollIntoView).
 * @param {number} stripHeightPx — высота полоски подсказки
 * @param {number} [tabbarInsetPx=64]
 */
export function getGuidanceBottomReservePx(stripHeightPx, tabbarInsetPx = 64) {
  const strip = Number(stripHeightPx) || 0;
  const tab = Number(tabbarInsetPx) || 64;
  return strip + tab + 16;
}

/**
 * Подкрутить scrollTop, если якорь перекрыт нижней полосой или выше видимой области.
 */
export function scrollGuidanceAnchorIntoView({ scrollEl, target, bottomReservePx }) {
  if (!target) return;

  const reserve = Math.max(120, Number(bottomReservePx) || 200);
  const targetRect = target.getBoundingClientRect();
  const maxBottom = window.innerHeight - reserve;

  if (scrollEl) {
    const parentRect = scrollEl.getBoundingClientRect();
    const topLimit = parentRect.top + 12;
    const bottomLimit = Math.min(parentRect.bottom - 12, maxBottom);

    if (targetRect.top >= topLimit && targetRect.bottom <= bottomLimit) {
      return;
    }

    const offsetTop = targetRect.top - parentRect.top + scrollEl.scrollTop;
    const viewH = scrollEl.clientHeight;
    const goal =
      offsetTop - Math.max(48, (viewH - (bottomLimit - parentRect.top)) * 0.35);
    scrollEl.scrollTo({ top: Math.max(0, goal), behavior: 'smooth' });
    return;
  }

  if (targetRect.bottom > maxBottom || targetRect.top < 12) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
