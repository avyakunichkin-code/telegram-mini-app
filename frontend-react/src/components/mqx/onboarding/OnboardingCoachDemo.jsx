import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoneyText } from '../../MoneyText';
import {
  MqxDashStack,
  MqxDashboardHero,
  MqxDivider,
  MqxFinancePeriodBlock,
  MqxLevelDash,
  MqxPeriodActions,
} from '../index';
import { OnboardingCoachOverlay } from './OnboardingCoachOverlay';
import { ONBOARDING_PRACTICE_MS, ONBOARDING_STEPS } from './onboardingSteps';
import { useOnboardingCoachState } from './useOnboardingCoachState';
import { MqxButton } from '../primitives/MqxButton';

/** Интерактивная витрина guided onboarding в #/dev/mqx (стек как в DashboardPremium). */
export function OnboardingCoachDemo() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(true);
  const [done, setDone] = useState(false);
  const [cash, setCash] = useState(42_150);
  const [cushion, setCushion] = useState(0);
  const [salaryTaken, setSalaryTaken] = useState(false);

  const coach = useOnboardingCoachState({
    practiceMs: ONBOARDING_PRACTICE_MS,
    onComplete: () => {
      setDone(true);
      setActive(false);
    },
  });

  const handleSalary = () => {
    if (!salaryTaken) {
      setCash((c) => c + 50_000);
      setSalaryTaken(true);
    }
    coach.markSalaryDone();
  };

  const handleCushion = () => {
    const amount = Math.min(5000, cash);
    if (amount <= 0) return;
    setCash((c) => c - amount);
    setCushion((s) => s + amount);
    coach.markCushionDone();
  };

  const restart = () => {
    setDone(false);
    setActive(true);
    setCash(42_150);
    setCushion(0);
    setSalaryTaken(false);
    coach.reset();
  };

  const overlay =
    active && coach.showOverlay && coach.step ? (
      <OnboardingCoachOverlay
        open
        step={coach.step}
        skipPressCount={coach.skipPressCount}
        rootRef={rootRef}
        anchor={coach.step?.anchor}
        onSkip={coach.handleSkip}
        onContinue={coach.handleBubbleContinue}
      />
    ) : null;

  return (
    <div className="mqx-onboarding-demo">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        Прототип <strong>guided coach</strong> (5 шагов). Стек дашборда — как в prod (S5 / L3). После «Понятно» —{' '}
        <strong>10 с</strong> без пузыря. Skip: 1-й — шаг, 2-й — весь онбординг.
      </p>

      <div className="mqx-onboarding-demo__toolbar">
        <span className="mqx-onboarding-demo__status">
          {done
            ? 'Онбординг завершён'
            : `Шаг ${coach.stepIndex + 1}/${ONBOARDING_STEPS.length}: ${coach.step?.id ?? '—'} · ${coach.phase}`}
        </span>
        <MqxButton variant="secondary" onClick={restart}>
          Сбросить демо
        </MqxButton>
      </div>

      <div ref={rootRef} className="mqx-onboarding-demo__game" style={{ maxWidth: 420 }}>
        <MqxDashStack>
          <MqxDashboardHero
            periodIndex={1}
            onCloseMonth={() => {}}
            pendingEventsCount={0}
          />
          <MqxDivider />
          <MqxFinancePeriodBlock
            financeCards={[
              {
                title: 'Баланс',
                valueNode: <MoneyText value={cash} />,
                accent: 'mqx-accent--violet',
                icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg>,
              },
              {
                title: 'Подушка',
                valueNode: <MoneyText value={cushion} />,
                accent: 'mqx-accent--emerald',
                icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7v6c0 5" /></svg>,
              },
            ]}
            onGoFinance={() => {}}
          />
          <MqxDivider />
          <MqxPeriodActions
            busy={false}
            onSalary={handleSalary}
            onContribute={handleCushion}
            onWithdraw={() => {}}
            onInvest={() => {}}
          />
          <MqxDivider />
          <MqxLevelDash periodIndex={1} victory={{ goals_met: 0, goals_required: 3, goals: [] }} />
        </MqxDashStack>
      </div>

      {overlay && createPortal(overlay, document.body)}
    </div>
  );
}
