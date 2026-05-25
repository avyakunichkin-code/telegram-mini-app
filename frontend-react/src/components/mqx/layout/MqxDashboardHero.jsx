import { BrandLogo } from '../../BrandLogo';
import { MqxButton } from '../primitives/MqxButton';
import { MqxPill } from '../primitives/MqxPill';

const CloseMonthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
    <path d="M5 12h12" />
    <path d="m13 8 4 4-4 4" />
  </svg>
);

/**
 * Hero дашборда (TB1, layout H2): период слева, справа — «Закрыть месяц» + «События».
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
          <span className="mqx-hero-turn__status-hint">Месяц открыт</span>
          <span className="mqx-hero-turn__period-label">Период</span>
          <span className="mqx-hero-turn__period-value">#{periodIndex}</span>
        </div>

        <div className="mqx-hero-turn__actions-col">
          <MqxButton
            type="button"
            variant="hero-filled"
            className="mqx-hero-turn__cta-primary mqx-hero-turn__cta-primary--wide"
            disabled={closeMonthDisabled}
            onClick={onCloseMonth}
            data-onboarding-anchor="next_period"
            title="Закрыть текущий месяц и перейти к следующему периоду"
            aria-label="Закрыть месяц и перейти к следующему периоду"
          >
            <CloseMonthIcon />
            Закрыть месяц
          </MqxButton>
          {onOpenEvents ? (
            <MqxPill
              events
              badge={pendingEventsCount > 0 ? pendingEventsCount : undefined}
              onClick={onOpenEvents}
              className="mqx-hero-turn__events-pill"
            >
              События
            </MqxPill>
          ) : null}
        </div>
      </div>
    </header>
  );
}
