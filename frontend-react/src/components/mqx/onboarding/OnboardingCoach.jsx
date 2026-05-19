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
 * @param {() => void} [props.onSalaryClaimed] — вызывается при гейте зарплаты (prod: API)
 * @param {() => void} [props.onCushionContributed]
 */
export function OnboardingCoach({
  active,
  rootRef,
  onComplete,
  practiceMs,
  onSalaryClaimed,
  onCushionContributed,
}) {
  const coach = useOnboardingCoachState({ practiceMs, onComplete });

  if (!active || !coach.showCoach) {
    return null;
  }

  const overlay = (
    <OnboardingCoachOverlay
      open={active && coach.showCoach}
      step={coach.step}
      phase={coach.phase}
      practiceLeftSec={coach.practiceLeftSec}
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
