import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API } from '../api';
import {
  bumpGuidanceSessionDismissCount,
  getGuidanceSessionDismissCount,
  resetGuidanceSessionDismissCount,
} from '../guidance/sessionDismiss';
import {
  computeGuidanceScrollPad,
  computeGuidanceSheetLift,
  parseCssPx,
} from '../guidance/guidanceStripLayout';
import { useGuidanceAnchorFocus } from '../guidance/useGuidanceAnchorFocus';
import { MqxGuidanceAnchorLink } from './mqx/guidance/MqxGuidanceAnchorLink';
import { MqxGuidanceStrip } from './mqx/guidance/MqxGuidanceStrip';

function readTabInsetPx() {
  const root = getComputedStyle(document.documentElement);
  const measured = parseCssPx(root.getPropertyValue('--mqx-tabbar-measured'), 0);
  if (measured > 0) return measured;
  return parseCssPx(root.getPropertyValue('--tma-tabbar-inset'), 64);
}

/**
 * O2 Progressive Guidance — bottom strip, синхронизация с overview.guidance + PATCH.
 * 2× закрытие (×) в одной сессии UI → skip_all; 1× → dismiss_beat на сервере.
 */
export function GameGuidanceLayer({
  guidance,
  refreshOverview,
  onOverlayStateChange,
  scrollRootRef = null,
  deferForPeriodClose = false,
}) {
  const stripRef = useRef(null);
  const [stripHeightPx, setStripHeightPx] = useState(0);
  const [dismissedNudgeId, setDismissedNudgeId] = useState(null);
  const [sessionDismissCount, setSessionDismissCount] = useState(() =>
    getGuidanceSessionDismissCount(),
  );

  const showCurriculum = guidance?.show_curriculum === true;
  const showNudge = !showCurriculum && guidance?.nudge_id && guidance.nudge_id !== dismissedNudgeId;
  const wouldShow = showCurriculum || showNudge;
  const visible = wouldShow && !deferForPeriodClose;

  const patch = useCallback(
    async (payload) => {
      try {
        const res = await API.patchGuidance(payload);
        await refreshOverview?.();
        return res?.guidance;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[guidance] PATCH failed', payload, err);
        }
        return null;
      }
    },
    [refreshOverview],
  );

  useEffect(() => {
    onOverlayStateChange?.({
      visible: !!visible,
      lockTabs: !!showCurriculum && !!visible,
    });
  }, [visible, showCurriculum, onOverlayStateChange]);

  useEffect(() => {
    if (!visible) {
      document.body.classList.remove('mqx-page--guidance-active');
      return undefined;
    }
    document.body.classList.add('mqx-page--guidance-active');
    return () => {
      document.body.classList.remove('mqx-page--guidance-active');
    };
  }, [visible]);

  useGuidanceAnchorFocus({
    rootRef: scrollRootRef,
    beatId: showCurriculum ? guidance?.beat_id : null,
    active: showCurriculum && visible,
    stripHeightPx,
  });

  useEffect(() => {
    if (!visible) {
      setStripHeightPx(0);
      document.documentElement.style.removeProperty('--mqx-guidance-scroll-pad');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-lift');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-bottom');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-offset');
      return undefined;
    }

    document.documentElement.style.removeProperty('--mqx-guidance-strip-bottom');

    const node = stripRef.current;
    if (!node) return undefined;

    const apply = () => {
      const h = Math.ceil(node.getBoundingClientRect().height);
      setStripHeightPx(h);
      const tab = readTabInsetPx();
      const scrollPad = computeGuidanceScrollPad(h, 12);
      const lift = computeGuidanceSheetLift(h, tab, 4);
      document.documentElement.style.setProperty('--mqx-guidance-scroll-pad', scrollPad);
      document.documentElement.style.setProperty('--mqx-guidance-strip-lift', lift);
      document.documentElement.style.setProperty('--mqx-guidance-strip-offset', `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--mqx-guidance-scroll-pad');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-lift');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-offset');
    };
  }, [visible, guidance?.beat_id, guidance?.view_index, guidance?.title, guidance?.body]);

  const handleCurriculumDismiss = useCallback(async () => {
    const next = bumpGuidanceSessionDismissCount();
    setSessionDismissCount(next);
    if (next >= 2) {
      resetGuidanceSessionDismissCount();
      setSessionDismissCount(0);
      await patch({ action: 'skip_all' });
      await refreshOverview?.();
      return;
    }
    await patch({
      action: 'dismiss_beat',
      beat_id: guidance?.beat_id ?? undefined,
    });
    await refreshOverview?.();
  }, [patch, guidance?.beat_id, refreshOverview]);

  const handleNudgeDismiss = useCallback(() => {
    setDismissedNudgeId(guidance?.nudge_id ?? null);
  }, [guidance?.nudge_id]);

  if (!visible) {
    return null;
  }

  let layer = null;

  if (showNudge) {
    layer = (
      <MqxGuidanceStrip
        ref={stripRef}
        mode="nudge"
        showMascot
        title={guidance.nudge_title}
        body={guidance.nudge_body}
        showNav={false}
        onDismiss={handleNudgeDismiss}
      />
    );
  } else {
    const beatId = guidance.beat_id;
    const isReadGate =
      beatId === 'p1_period' ||
      beatId === 'p1_flows' ||
      beatId === 'p2_new_month' ||
      beatId === 't_finance_actions' ||
      beatId === 't_finance_details' ||
      beatId === 't_needs' ||
      beatId === 't_farewell' ||
      (beatId === 'p1_close' && guidance.show_debrief);

    const showContinue =
      isReadGate && (!guidance.beat_completed || (guidance.beat_id === 'p1_close' && guidance.show_debrief));

    const dismissHint =
      sessionDismissCount === 1 ? 'Ещё раз — пропустить всё обучение' : undefined;

    layer = (
      <>
        <MqxGuidanceAnchorLink
          stripRef={stripRef}
          scrollRootRef={scrollRootRef}
          beatId={guidance.beat_id}
          active={showCurriculum && visible}
        />
        <MqxGuidanceStrip
          ref={stripRef}
          mode="curriculum"
          showMascot
          title={guidance.title}
          body={guidance.body}
          moduleStep={guidance.module_step}
          moduleStepCount={guidance.module_step_count}
          viewIndex={guidance.view_index}
          lastCompletedIndex={guidance.last_completed_index}
          beatCompleted={guidance.beat_completed && !showContinue}
          dismissHint={dismissHint}
          showNav
          onDismiss={handleCurriculumDismiss}
          onPrev={() =>
            patch({
              action: 'nav',
              view_index: Math.max(0, (guidance.view_index ?? 0) - 1),
            })
          }
          onNext={() =>
            patch({
              action: 'nav',
              view_index: (guidance.view_index ?? 0) + 1,
            })
          }
          onContinue={
            showContinue
              ? () => patch({ action: 'advance_read', beat_id: guidance.beat_id })
              : undefined
          }
        />
      </>
    );
  }

  return createPortal(
    <div className="mqx-guidance-portal" data-testid="mqx-guidance-portal">
      {layer}
    </div>,
    document.body,
  );
}
