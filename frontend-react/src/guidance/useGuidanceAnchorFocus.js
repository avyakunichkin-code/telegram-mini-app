import { useEffect } from 'react';
import {
  getGuidanceAnchorForBeat,
  getGuidanceBottomReservePx,
  GUIDANCE_ANCHOR_FOCUS_CLASS,
  scrollGuidanceAnchorIntoView,
} from './guidanceAnchors';

function parsePx(value) {
  const n = parseFloat(String(value || '').trim());
  return Number.isFinite(n) ? n : 64;
}

function clearFocusMarkers(root) {
  if (!root) return;
  root.querySelectorAll(`.${GUIDANCE_ANCHOR_FOCUS_CLASS}`).forEach((el) => {
    el.classList.remove(GUIDANCE_ANCHOR_FOCUS_CLASS);
  });
}

/**
 * Подсветка якоря шага + автоскролл в зоне .mqx-tab-page__scroll.
 */
export function useGuidanceAnchorFocus({ rootRef, beatId, active, stripHeightPx = 0, liftExtraPx = 0 }) {
  useEffect(() => {
    const root = rootRef?.current;
    if (!root || !active) {
      clearFocusMarkers(root);
      return undefined;
    }

    const anchorId = getGuidanceAnchorForBeat(beatId);
    if (!anchorId) {
      clearFocusMarkers(root);
      return undefined;
    }

    const scrollEl = root.querySelector('.mqx-tab-page__scroll');
    const target = root.querySelector(`[data-onboarding-anchor="${anchorId}"]`);
    clearFocusMarkers(root);

    if (!target) {
      return undefined;
    }

    target.classList.add(GUIDANCE_ANCHOR_FOCUS_CLASS);

    const runScroll = () => {
      const tabInset = parsePx(
        getComputedStyle(document.documentElement).getPropertyValue('--tma-tabbar-inset'),
      );
      const padRaw = getComputedStyle(document.documentElement).getPropertyValue(
        '--mqx-guidance-scroll-pad',
      );
      const padFromCss = parsePx(padRaw, 0);
      const reserve =
        padFromCss > 0
          ? padFromCss
          : getGuidanceBottomReservePx(stripHeightPx, tabInset) + (Number(liftExtraPx) || 0);
      scrollGuidanceAnchorIntoView({ scrollEl, target, bottomReservePx: reserve });
    };

    const raf = requestAnimationFrame(runScroll);
    const t2 = window.setTimeout(runScroll, 320);
    scrollEl?.addEventListener('scroll', runScroll, { passive: true });
    window.addEventListener('resize', runScroll);
    window.visualViewport?.addEventListener('resize', runScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t2);
      scrollEl?.removeEventListener('scroll', runScroll);
      window.removeEventListener('resize', runScroll);
      window.visualViewport?.removeEventListener('resize', runScroll);
      clearFocusMarkers(root);
    };
  }, [rootRef, beatId, active, stripHeightPx, liftExtraPx]);
}
