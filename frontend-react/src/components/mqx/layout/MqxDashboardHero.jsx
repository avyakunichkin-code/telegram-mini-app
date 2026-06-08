import { BrandLogo } from '../../BrandLogo';
import { FINISH_TURN_BUTTON, TURN_OPEN_STATUS, TURN_SINGULAR } from '../../../constants/turnCopy';
import { MqxButton } from '../primitives/MqxButton';
import { MqxPill } from '../primitives/MqxPill';

/**
 * Hero дашборда (TB1, layout H2): ход слева, справа — «Завершить ход» + «События».
 * Без таймера и play/pause.
 */
export function MqxDashboardHero({
  periodIndex,
  onCloseMonth,
  closeMonthDisabled = false,
  pendingEventsCount = 0,
  onOpenEvents,
}) {
  return (
    <header className="mqx-hero mqx-hero--compact mqx-hero--turn" data-onboarding-anchor="hero">
      <div className="mqx-hero__glow" aria-hidden />

      <div className="mqx-hero-turn__row-single">
        <div className="mqx-hero-compact__logo" aria-hidden>
          <BrandLogo variant="compact" />
        </div>

        <div className="mqx-hero-turn__period-block">
          <span className="mqx-hero-turn__status-hint">{TURN_OPEN_STATUS}</span>
          <span className="mqx-hero-turn__period-label">{TURN_SINGULAR}</span>
          <span className="mqx-hero-turn__period-value">#{periodIndex}</span>
        </div>

        <div className="mqx-hero-turn__actions-col">
          {onOpenEvents ? (
            <MqxPill
              events
              badge={pendingEventsCount > 0 ? pendingEventsCount : undefined}
              onClick={onOpenEvents}
              className="mqx-hero-turn__events-pill"
              data-onboarding-anchor="events"
            >
              События
            </MqxPill>
          ) : null}
          <MqxButton
            type="button"
            variant="hero-filled"
            className="mqx-hero-turn__cta-primary mqx-hero-turn__cta-primary--wide"
            disabled={closeMonthDisabled}
            onClick={onCloseMonth}
            data-onboarding-anchor="next_period"
            title="Завершить текущий ход и перейти к следующему"
            aria-label="Завершить ход и перейти к следующему"
          >
            {FINISH_TURN_BUTTON}
          </MqxButton>
        </div>
      </div>
    </header>
  );
}
