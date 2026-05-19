import { createPortal } from 'react-dom';
import { OnboardingCoachOverlay } from './OnboardingCoachOverlay';
import { useOnboardingCoachState } from './useOnboardingCoachState';

/**
 * Guided onboarding coach (MQX prototype / GameScreen).
 * @param {object} props
 * @param {boolean} props.active
 * @param {import('react').RefObject<HTMLElement>} props.rootRef — контейнер с data-onboarding-anchor
 * @param {() => void} [props.onComplete]
 * @param {number} [props.practiceMs]
 */
export function OnboardingCoach({ active, rootRef, onComplete, practiceMs }) {
  const coach = useOnboardingCoachState({ practiceMs, onComplete });

  if (!active || !coach.showCoach) {
    return null;
  }

  if (!coach.showOverlay) {
    return null;
  }

  const overlay = (
    <OnboardingCoachOverlay
      open
      step={coach.step}
      skipPressCount={coach.skipPressCount}
      rootRef={rootRef}
      anchor={coach.step?.anchor}
      onSkip={coach.handleSkip}
      onContinue={coach.handleBubbleContinue}
    />
  );

  return createPortal(overlay, document.body);
}

export { useOnboardingCoachState };
