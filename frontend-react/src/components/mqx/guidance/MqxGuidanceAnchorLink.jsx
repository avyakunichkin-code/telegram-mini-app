import { useEffect, useState } from 'react';
import { getGuidanceAnchorForBeat } from '../../../guidance/guidanceAnchors';

function buildLinkGeometry(stripEl, targetEl) {
  if (!stripEl || !targetEl) return null;

  const strip = stripEl.getBoundingClientRect();
  const tr = targetEl.getBoundingClientRect();

  const x1 = strip.left + strip.width * 0.42;
  const y1 = strip.top + 2;
  const x2 = tr.left + tr.width / 2;
  const y2 = tr.top + Math.min(tr.height * 0.55, tr.height - 4);

  if (y2 >= y1 - 12) return null;

  const span = y1 - y2;
  const cy = y1 - Math.max(28, span * 0.42);
  const cx = x1 + (x2 - x1) * 0.45;

  return {
    path: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    dot: { cx: x2, cy: y2 },
  };
}

/**
 * Пунктирная дуга от верхней кромки guidance strip к якорю шага (curriculum).
 */
export function MqxGuidanceAnchorLink({ stripRef, scrollRootRef, beatId, active }) {
  const [geom, setGeom] = useState(null);

  useEffect(() => {
    if (!active) {
      setGeom(null);
      return undefined;
    }

    const anchorId = getGuidanceAnchorForBeat(beatId);
    const root = scrollRootRef?.current;
    const strip = stripRef?.current;
    if (!anchorId || !root || !strip) {
      setGeom(null);
      return undefined;
    }

    const update = () => {
      const target = root.querySelector(`[data-onboarding-anchor="${anchorId}"]`);
      setGeom(buildLinkGeometry(strip, target));
    };

    update();
    const scrollEl = root.querySelector('.mqx-tab-page__scroll');
    scrollEl?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    const ro = new ResizeObserver(update);
    ro.observe(strip);
    const target = root.querySelector(`[data-onboarding-anchor="${anchorId}"]`);
    if (target) ro.observe(target);

    return () => {
      scrollEl?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [active, beatId, scrollRootRef, stripRef]);

  if (!geom) return null;

  return (
    <svg className="mqx-guidance-anchor-link" aria-hidden="true">
      <path className="mqx-guidance-anchor-link__path" d={geom.path} />
      <circle
        className="mqx-guidance-anchor-link__dot"
        cx={geom.dot.cx}
        cy={geom.dot.cy}
        r="4"
      />
    </svg>
  );
}
