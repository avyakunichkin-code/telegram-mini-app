import { useCallback, useEffect, useState } from 'react';
import { API } from '../api';
import {
  bumpGuidanceSessionDismissCount,
  getGuidanceSessionDismissCount,
  resetGuidanceSessionDismissCount,
} from '../guidance/sessionDismiss';
import { MqxGuidanceStrip } from './mqx/guidance/MqxGuidanceStrip';

/**
 * O2 Progressive Guidance — bottom strip, синхронизация с overview.guidance + PATCH.
 * 2× закрытие (×) в одной сессии UI → skip_all; 1× → dismiss_beat на сервере.
 */
export function GameGuidanceLayer({
  guidance,
  refreshOverview,
  onOverlayStateChange,
}) {
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
        mode="nudge"
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
    <MqxGuidanceStrip
      mode="curriculum"
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
  );
}
