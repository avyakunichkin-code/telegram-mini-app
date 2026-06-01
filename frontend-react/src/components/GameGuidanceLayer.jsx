import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '../api';
import { MqxGuidanceStrip } from './mqx/guidance/MqxGuidanceStrip';

/**
 * O2 Progressive Guidance — bottom strip, синхронизация с overview.guidance + PATCH.
 */
export function GameGuidanceLayer({
  guidance,
  refreshOverview,
  onOverlayStateChange,
}) {
  const autoAdvanceRef = useRef(false);
  const [dismissedNudgeId, setDismissedNudgeId] = useState(null);

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

  useEffect(() => {
    if (!showCurriculum || !guidance?.beat_completed || !guidance?.beat_id) {
      autoAdvanceRef.current = false;
      return;
    }
    if (autoAdvanceRef.current) return;
    const beat = guidance.beat_id;
    const gateRead = beat === 'p2_events_done' || beat === 'p3_needs';
    if (!gateRead && beat !== 'p1_close') {
      autoAdvanceRef.current = true;
      const t = setTimeout(() => {
        patch({ action: 'advance_read', beat_id: beat }).finally(() => {
          autoAdvanceRef.current = false;
        });
      }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [showCurriculum, guidance?.beat_completed, guidance?.beat_id, patch]);

  if (!visible) {
    return null;
  }

  if (showNudge) {
    return (
      <MqxGuidanceStrip
        mode="nudge"
        title={guidance.nudge_title}
        body={guidance.nudge_body}
        showNav={false}
        onDismiss={() => setDismissedNudgeId(guidance.nudge_id)}
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

  return (
    <MqxGuidanceStrip
      mode="curriculum"
      title={guidance.title}
      body={guidance.body}
      moduleStep={guidance.module_step}
      moduleStepCount={guidance.module_step_count}
      viewIndex={guidance.view_index}
      lastCompletedIndex={guidance.last_completed_index}
      beatCompleted={guidance.beat_completed && !showContinue}
      showNav
      onDismiss={() => patch({ action: 'dismiss_beat' })}
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
  );
}
