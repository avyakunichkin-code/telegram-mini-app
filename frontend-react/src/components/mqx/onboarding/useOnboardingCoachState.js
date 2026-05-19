import { useCallback, useEffect, useRef, useState } from 'react';
import { getOnboardingStep, ONBOARDING_PRACTICE_MS, ONBOARDING_STEPS } from './onboardingSteps';

/**
 * Состояние guided coach: шаг, фаза bubble/practice, skip×2, гейты действий.
 * @param {object} opts
 * @param {number} [opts.practiceMs]
 * @param {() => void} [opts.onComplete]
 */
export function useOnboardingCoachState({ practiceMs = ONBOARDING_PRACTICE_MS, onComplete } = {}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState('bubble');
  const [skipPressCount, setSkipPressCount] = useState(0);
  const [practiceLeftSec, setPracticeLeftSec] = useState(0);
  const [salaryDone, setSalaryDone] = useState(false);
  const [cushionDone, setCushionDone] = useState(false);
  const practiceTimerRef = useRef(null);
  const tickRef = useRef(null);

  const step = getOnboardingStep(stepIndex);
  const isLast = stepIndex >= ONBOARDING_STEPS.length - 1;

  const clearPracticeTimers = useCallback(() => {
    if (practiceTimerRef.current) {
      clearTimeout(practiceTimerRef.current);
      practiceTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setPracticeLeftSec(0);
  }, []);

  const goNextStep = useCallback(() => {
    clearPracticeTimers();
    setPhase('bubble');
    setStepIndex((i) => {
      const next = i + 1;
      if (next >= ONBOARDING_STEPS.length) {
        onComplete?.();
        return i;
      }
      return next;
    });
  }, [clearPracticeTimers, onComplete]);

  const finishAll = useCallback(() => {
    clearPracticeTimers();
    onComplete?.();
    setStepIndex(ONBOARDING_STEPS.length - 1);
    setPhase('done');
  }, [clearPracticeTimers, onComplete]);

  const startPractice = useCallback(() => {
    if (!step || step.gate !== 'practice') return;
    clearPracticeTimers();
    setPhase('practice');
    const totalSec = Math.ceil(practiceMs / 1000);
    setPracticeLeftSec(totalSec);
    tickRef.current = setInterval(() => {
      setPracticeLeftSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    practiceTimerRef.current = setTimeout(() => {
      clearPracticeTimers();
      goNextStep();
    }, practiceMs);
  }, [step, practiceMs, clearPracticeTimers, goNextStep]);

  const handleSkip = useCallback(() => {
    const nextSkip = skipPressCount + 1;
    setSkipPressCount(nextSkip);
    if (nextSkip >= 2) {
      finishAll();
      return;
    }
    if (isLast) {
      finishAll();
      return;
    }
    goNextStep();
  }, [skipPressCount, isLast, finishAll, goNextStep]);

  const handleBubbleContinue = useCallback(() => {
    if (!step) return;
    if (step.gate === 'practice') {
      startPractice();
      return;
    }
    if (step.gate === 'finish') {
      finishAll();
    }
  }, [step, startPractice, finishAll]);

  const markSalaryDone = useCallback(() => {
    setSalaryDone(true);
    if (step?.actionKey === 'salary') {
      clearPracticeTimers();
      setPhase('bubble');
      goNextStep();
    }
  }, [step, clearPracticeTimers, goNextStep]);

  const markCushionDone = useCallback(() => {
    setCushionDone(true);
    if (step?.actionKey === 'cushion') {
      clearPracticeTimers();
      setPhase('bubble');
      goNextStep();
    }
  }, [step, clearPracticeTimers, goNextStep]);

  const reset = useCallback(() => {
    clearPracticeTimers();
    setStepIndex(0);
    setPhase('bubble');
    setSkipPressCount(0);
    setSalaryDone(false);
    setCushionDone(false);
  }, [clearPracticeTimers]);

  useEffect(() => () => clearPracticeTimers(), [clearPracticeTimers]);

  return {
    step,
    stepIndex,
    phase,
    skipPressCount,
    practiceLeftSec,
    salaryDone,
    cushionDone,
    isLast,
    showBubble: phase === 'bubble' && step?.gate !== 'done',
    showCoach: phase !== 'done' && stepIndex < ONBOARDING_STEPS.length,
    handleSkip,
    handleBubbleContinue,
    markSalaryDone,
    markCushionDone,
    reset,
    finishAll,
  };
}
