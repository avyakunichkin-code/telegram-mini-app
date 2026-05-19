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
  const salarySyncedRef = useRef(false);
  const cushionSyncedRef = useRef(false);

  const needsOnboarding = overview && DRAFT_STATES.has(overview.onboarding_state);

  const persist = useCallback(
    async (patch) => {
      try {
        await API.patchOnboarding(patch);
      } catch {
        /* не блокируем UX */
      }
    },
    [],
  );

  const coach = useOnboardingCoachState({
    onComplete: async () => {
      await persist({ onboarding_state: 'brief_done', onboarding_step: 'farewell' });
      await refreshOverview?.();
    },
  });

  const { restoreStepIndex, markSalaryDone, markCushionDone } = coach;

  useEffect(() => {
    if (!needsOnboarding) {
      hydratedRef.current = false;
      salarySyncedRef.current = false;
      cushionSyncedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const salaryDone = periodStatus?.salary_claimed === true;
    const cushionDone = (periodStatus?.safety_fund_contribution ?? 0) > 0;
    if (salaryDone) salarySyncedRef.current = true;
    if (cushionDone) cushionSyncedRef.current = true;
    restoreStepIndex(stepIndexFromId(overview.onboarding_step), { salaryDone, cushionDone });
  }, [needsOnboarding, overview?.onboarding_step, periodStatus, restoreStepIndex]);

  useEffect(() => {
    onOverlayVisibleChange?.(!!needsOnboarding && coach.showOverlay);
  }, [needsOnboarding, coach.showOverlay, onOverlayVisibleChange]);

  useEffect(() => {
    if (!needsOnboarding || !coach.step?.id) return;
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

  if (!needsOnboarding || !coach.showCoach || !coach.showOverlay) {
    return null;
  }

  return createPortal(
    <OnboardingCoachOverlay
      open
      step={coach.step}
      skipPressCount={coach.skipPressCount}
      rootRef={rootRef}
      anchor={coach.step?.anchor}
      onSkip={coach.handleSkip}
      onContinue={coach.handleBubbleContinue}
    />,
    document.body,
  );
}
