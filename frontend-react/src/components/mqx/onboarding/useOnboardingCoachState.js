import { useCallback, useEffect, useRef, useState } from 'react';
import { getOnboardingStep, ONBOARDING_PRACTICE_MS, ONBOARDING_STEPS } from './onboardingSteps';

function shouldSkipStep(step, { salaryDone, cushionDone }) {
  if (step.id === 'salary' && salaryDone) return true;
  if (step.id === 'safety_fund' && cushionDone) return true;
  return false;
}

function resolveNextIndex(fromIndex, flags) {
  let next = fromIndex + 1;
  while (next < ONBOARDING_STEPS.length && shouldSkipStep(ONBOARDING_STEPS[next], flags)) {
    next += 1;
  }
  return next;
}

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
  const [salaryDone, setSalaryDone] = useState(false);
  const [cushionDone, setCushionDone] = useState(false);
  const practiceTimerRef = useRef(null);
  const flagsRef = useRef({ salaryDone: false, cushionDone: false });

  const step = getOnboardingStep(stepIndex);
  const isLast = stepIndex >= ONBOARDING_STEPS.length - 1;

  const syncFlagsRef = useCallback(() => {
    flagsRef.current = { salaryDone, cushionDone };
  }, [salaryDone, cushionDone]);

  useEffect(() => {
    syncFlagsRef();
  }, [syncFlagsRef]);

  const clearPracticeTimer = useCallback(() => {
    if (practiceTimerRef.current) {
      clearTimeout(practiceTimerRef.current);
      practiceTimerRef.current = null;
    }
  }, []);

  const goNextStep = useCallback(() => {
    clearPracticeTimer();
    setPhase('bubble');
    setStepIndex((i) => {
      const next = resolveNextIndex(i, flagsRef.current);
      if (next >= ONBOARDING_STEPS.length) {
        onComplete?.();
        return i;
      }
      return next;
    });
  }, [clearPracticeTimer, onComplete]);

  const finishAll = useCallback(() => {
    clearPracticeTimer();
    onComplete?.();
    setStepIndex(ONBOARDING_STEPS.length - 1);
    setPhase('done');
  }, [clearPracticeTimer, onComplete]);

  const startPractice = useCallback(() => {
    if (!step || step.gate !== 'practice') return;
    clearPracticeTimer();
    setPhase('practice');
    practiceTimerRef.current = setTimeout(() => {
      practiceTimerRef.current = null;
      goNextStep();
    }, practiceMs);
  }, [step, practiceMs, clearPracticeTimer, goNextStep]);

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

  /** Зарплата получена или уже была получена в этом периоде. */
  const markSalaryDone = useCallback(() => {
    setSalaryDone(true);
    flagsRef.current = { ...flagsRef.current, salaryDone: true };
    if (step?.actionKey === 'salary' && phase === 'bubble') {
      goNextStep();
    }
  }, [step, phase, goNextStep]);

  const markCushionDone = useCallback(() => {
    setCushionDone(true);
    flagsRef.current = { ...flagsRef.current, cushionDone: true };
    if (step?.actionKey === 'cushion' && phase === 'bubble') {
      goNextStep();
    }
  }, [step, phase, goNextStep]);

  const reset = useCallback(() => {
    clearPracticeTimer();
    setStepIndex(0);
    setPhase('bubble');
    setSkipPressCount(0);
    setSalaryDone(false);
    setCushionDone(false);
    flagsRef.current = { salaryDone: false, cushionDone: false };
  }, [clearPracticeTimer]);

  const restoreStepIndex = useCallback(
    (index, { salaryDone: sal = false, cushionDone: cush = false } = {}) => {
      clearPracticeTimer();
      const i = Math.max(0, Math.min(index, ONBOARDING_STEPS.length - 1));
      setStepIndex(i);
      setPhase('bubble');
      setSalaryDone(sal);
      setCushionDone(cush);
      flagsRef.current = { salaryDone: sal, cushionDone: cush };
    },
    [clearPracticeTimer],
  );

  useEffect(() => () => clearPracticeTimer(), [clearPracticeTimer]);

  /** Шаг «Зарплата» не показываем, если уже получена во время практики. */
  useEffect(() => {
    if (phase !== 'bubble' || step?.id !== 'salary' || !salaryDone) return;
    goNextStep();
  }, [phase, step?.id, salaryDone, goNextStep]);

  return {
    step,
    stepIndex,
    phase,
    skipPressCount,
    salaryDone,
    cushionDone,
    isLast,
    /** Затемнение + пузырь — только фаза bubble (практика 10 с = чистый UI, см. CONTENT.md). */
    showOverlay: phase === 'bubble' && stepIndex < ONBOARDING_STEPS.length,
    /** @deprecated используйте showOverlay; оставлено для совместимости демо */
    showScrim: phase === 'bubble' && stepIndex < ONBOARDING_STEPS.length,
    showCoach: phase !== 'done' && stepIndex < ONBOARDING_STEPS.length,
    handleSkip,
    handleBubbleContinue,
    markSalaryDone,
    markCushionDone,
    reset,
    restoreStepIndex,
    finishAll,
  };
}
