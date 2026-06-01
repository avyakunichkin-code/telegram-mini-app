import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '../api';
import {
  bumpGuidanceSessionDismissCount,
  getGuidanceSessionDismissCount,
  resetGuidanceSessionDismissCount,
} from '../guidance/sessionDismiss';
import { useGuidanceAnchorFocus } from '../guidance/useGuidanceAnchorFocus';
import { MqxGuidanceAnchorLink } from './mqx/guidance/MqxGuidanceAnchorLink';
import { MqxGuidanceStrip } from './mqx/guidance/MqxGuidanceStrip';

/**
 * O2 Progressive Guidance — bottom strip, синхронизация с overview.guidance + PATCH.
 * 2× закрытие (×) в одной сессии UI → skip_all; 1× → dismiss_beat на сервере.
 */
export function GameGuidanceLayer({
  guidance,
  refreshOverview,
  onOverlayStateChange,
  scrollRootRef = null,
}) {
  const stripRef = useRef(null);
  const [stripHeightPx, setStripHeightPx] = useState(0);
  const [dismissedNudgeId, setDismissedNudgeId] = useState(null);
  const [sessionDismissCount, setSessionDismissCount] = useState(() =>
    getGuidanceSessionDismissCount(),
  );

  const showCurriculum = guidance?.show_curriculum === true;
  const showNudge = !showCurriculum && guidance?.nudge_id && guidance.nudge_id !== dismissedNudgeId;
  const visible = showCurriculum || showNudge;

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
      lockTabs: !!showCurriculum,
    });
  }, [visible, showCurriculum, onOverlayStateChange]);

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
      return undefined;
    }

    const node = stripRef.current;
    if (!node) return undefined;

    const apply = () => {
      const h = Math.ceil(node.getBoundingClientRect().height);
      setStripHeightPx(h);
      const tabRaw = getComputedStyle(document.documentElement).getPropertyValue('--tma-tabbar-inset');
      const tab = parseFloat(tabRaw) || 64;
      const lift = `calc(${h}px + ${tab}px + 4px)`;
      document.documentElement.style.setProperty('--mqx-guidance-scroll-pad', `calc(${lift} + 16px)`);
      document.documentElement.style.setProperty('--mqx-guidance-strip-lift', lift);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--mqx-guidance-scroll-pad');
      document.documentElement.style.removeProperty('--mqx-guidance-strip-lift');
    };
  }, [visible, guidance?.beat_id, guidance?.view_index, guidance?.title, guidance?.body]);

  useEffect(() => {
    if (guidance?.show_curriculum === false && !guidance?.nudge_id) {
      resetGuidanceSessionDismissCount();
      setSessionDismissCount(0);
    }
  }, [guidance?.show_curriculum, guidance?.nudge_id]);

  const handleCurriculumDismiss = useCallback(async () => {
    const next = bumpGuidanceSessionDismissCount();
    setSessionDismissCount(next);
    if (next >= 2) {
      resetGuidanceSessionDismissCount();
      setSessionDismissCount(0);
      await patch({ action: 'skip_all' });
      return;
    }
    await patch({ action: 'dismiss_beat' });
  }, [patch]);

  const handleNudgeDismiss = useCallback(() => {
    setDismissedNudgeId(guidance?.nudge_id ?? null);
  }, [guidance?.nudge_id]);

  if (!visible) {
    return null;
  }

  if (showNudge) {
    return (
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
  }

  const isReadGate =
    guidance.beat_id === 'p1_period' ||
    guidance.beat_id === 'p2_events_done' ||
    guidance.beat_id === 'p3_needs' ||
    guidance.beat_id === 'p3_farewell' ||
    (guidance.beat_id === 'p1_close' && guidance.show_debrief);

  const showContinue =
    isReadGate && (!guidance.beat_completed || (guidance.beat_id === 'p1_close' && guidance.show_debrief));

  const dismissHint =
    sessionDismissCount === 1 ? 'Ещё раз — пропустить всё обучение' : undefined;

  return (
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
