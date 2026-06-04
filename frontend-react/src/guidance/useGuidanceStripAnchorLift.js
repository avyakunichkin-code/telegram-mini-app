import { useEffect } from 'react';
import { getGuidanceAnchorForBeat } from './guidanceAnchors';

const LIFT_BEATS = new Set(['p1_salary', 'p1_cushion']);

function parsePx(value, fallback) {
  const n = parseFloat(String(value || '').trim());
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Поднимает guidance strip, чтобы не перекрывать chip «Зарплата» / «Пополнить».
 * Задаёт --mqx-guidance-strip-bottom и доп. scroll-pad.
 */
export function useGuidanceStripAnchorLift({
  stripRef,
  rootRef,
  beatId,
  active,
  stripHeightPx,
  onLiftExtraPxChange,
}) {
  useEffect(() => {
    if (!active || !LIFT_BEATS.has(beatId)) {
      document.documentElement.style.removeProperty('--mqx-guidance-strip-bottom');
      onLiftExtraPxChange?.(0);
      return undefined;
    }

    const update = () => {
      const strip = stripRef?.current;
      const root = rootRef?.current;
      const anchorId = getGuidanceAnchorForBeat(beatId);
      const target = anchorId ? root?.querySelector(`[data-onboarding-anchor="${anchorId}"]`) : null;

      const tab = parsePx(
        getComputedStyle(document.documentElement).getPropertyValue('--tma-tabbar-inset'),
        64,
      );
      const defaultBottom = tab + 4;
      const stripH = strip?.getBoundingClientRect().height || stripHeightPx || 160;
      const gap = 14;

      if (!target) {
        document.documentElement.style.setProperty('--mqx-guidance-strip-bottom', `${defaultBottom}px`);
        onLiftExtraPxChange?.(0);
        return;
      }

      const tr = target.getBoundingClientRect();
      const neededBottom = window.innerHeight - tr.bottom - gap - stripH;
      const bottom = Math.max(defaultBottom, neededBottom);
      const extra = Math.max(0, bottom - defaultBottom);

      document.documentElement.style.setProperty('--mqx-guidance-strip-bottom', `${Math.round(bottom)}px`);
      onLiftExtraPxChange?.(extra);
    };

    update();
    const raf = requestAnimationFrame(update);
    const t2 = window.setTimeout(update, 360);

    const scrollEl = rootRef?.current?.querySelector('.mqx-tab-page__scroll');
    scrollEl?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    const ro = new ResizeObserver(update);
    if (stripRef?.current) ro.observe(stripRef.current);
    const anchorId = getGuidanceAnchorForBeat(beatId);
    const target = rootRef?.current?.querySelector(`[data-onboarding-anchor="${anchorId}"]`);
    if (target) ro.observe(target);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t2);
      scrollEl?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      ro.disconnect();
      document.documentElement.style.removeProperty('--mqx-guidance-strip-bottom');
      onLiftExtraPxChange?.(0);
    };
  }, [active, beatId, rootRef, stripRef, stripHeightPx, onLiftExtraPxChange]);
}
