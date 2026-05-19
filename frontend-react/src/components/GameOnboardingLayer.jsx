import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { API } from '../api';
import {
  OnboardingCoachOverlay,
  ONBOARDING_STEPS,
  useOnboardingCoachState,
} from './mqx';

const DRAFT_STATES = new Set(['draft', 'started']);

function stepIndexFromId(stepId) {
  if (!stepId) return 0;
  const idx = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  return idx >= 0 ? idx : 0;
}

/**
 * Guided onboarding на GameScreen: coach + синхронизация с API.
 */
export function GameOnboardingLayer({
  overview,
  periodStatus,
  rootRef,
  refreshOverview,
  onOverlayVisibleChange,
}) {
  const hydratedRef = useRef(false);
  const lastPersistedStepRef = useRef(null);
  const salarySyncedRef = useRef(false);
  const cushionSyncedRef = useRef(false);

  const needsOnboarding = overview && DRAFT_STATES.has(overview.onboarding_state);

  const persist = useCallback(async (patch) => {
    try {
      await API.patchOnboarding(patch);
    } catch {
      /* не блокируем UX */
    }
  }, []);

  const coach = useOnboardingCoachState({
    onComplete: async () => {
      await persist({ onboarding_state: 'brief_done', onboarding_step: 'farewell' });
      await refreshOverview?.();
    },
  });

  const { restoreStepIndex, markSalaryDone, markCushionDone, handleSkip } = coach;

  const onSkip = useCallback(() => {
    const nextSkip = coach.skipPressCount + 1;
    handleSkip();
    if (nextSkip >= 2) {
      // brief_done пишет onComplete из finishAll — здесь только skip_count
      persist({ onboarding_skip_count: 2 });
      return;
    }
    persist({ onboarding_skip_count: 1 });
  }, [coach.skipPressCount, handleSkip, persist]);

  useEffect(() => {
    if (!needsOnboarding) {
      hydratedRef.current = false;
      lastPersistedStepRef.current = null;
      salarySyncedRef.current = false;
      cushionSyncedRef.current = false;
      return;
    }
    if (!periodStatus || hydratedRef.current) return;

    const salaryDone = periodStatus.salary_claimed === true;
    const cushionDone = (periodStatus.safety_fund_contribution ?? 0) > 0;
    if (salaryDone) salarySyncedRef.current = true;
    if (cushionDone) cushionSyncedRef.current = true;

    const stepId = overview.onboarding_step || 'period_timer';
    restoreStepIndex(stepIndexFromId(stepId), { salaryDone, cushionDone });
    hydratedRef.current = true;
    lastPersistedStepRef.current = stepId;
  }, [needsOnboarding, overview?.onboarding_step, periodStatus, restoreStepIndex]);

  useEffect(() => {
    onOverlayVisibleChange?.(!!needsOnboarding && coach.showOverlay);
  }, [needsOnboarding, coach.showOverlay, onOverlayVisibleChange]);

  useEffect(() => {
    if (!needsOnboarding || !hydratedRef.current || !coach.step?.id) return;
    if (lastPersistedStepRef.current === coach.step.id) return;
    lastPersistedStepRef.current = coach.step.id;
    persist({ onboarding_step: coach.step.id });
  }, [needsOnboarding, coach.step?.id, coach.stepIndex, persist]);

  useEffect(() => {
    if (!needsOnboarding || !periodStatus?.salary_claimed || salarySyncedRef.current) return;
    salarySyncedRef.current = true;
    markSalaryDone();
  }, [needsOnboarding, periodStatus?.salary_claimed, markSalaryDone]);

  useEffect(() => {
    if (!needsOnboarding) return;
    const contributed = (periodStatus?.safety_fund_contribution ?? 0) > 0;
    if (!contributed || cushionSyncedRef.current) return;
    cushionSyncedRef.current = true;
    markCushionDone();
  }, [needsOnboarding, periodStatus?.safety_fund_contribution, markCushionDone]);

  if (!needsOnboarding || !coach.showOverlay || !coach.step) {
    return null;
  }

  return createPortal(
    <OnboardingCoachOverlay
      open
      step={coach.step}
      skipPressCount={coach.skipPressCount}
      rootRef={rootRef}
      anchor={coach.step?.anchor}
      onSkip={onSkip}
      onContinue={coach.handleBubbleContinue}
    />,
    document.body,
  );
}
