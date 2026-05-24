import { BrandLogo } from '../../BrandLogo';
import { MqxButton } from '../primitives/MqxButton';
import { MqxPill } from '../primitives/MqxPill';

function periodProgressFrac(durationSec, remainingSec) {
  const d = Number(durationSec);
  const r = Math.max(0, Number(remainingSec) || 0);
  if (!Number.isFinite(d) || d <= 0) return 0;
  return Math.min(1, Math.max(0, (d - r) / d));
}

/**
 * Компактный hero главной: строка 1 — лого, таймер + прогресс, play/pause;
 * строка 2 — период слева, события и «Следующий период» справа.
 */
export function MqxDashboardHero({
  periodIndex,
  timerLabel,
  timerValue,
  periodDurationSeconds,
  remainingSeconds,
  canPlay,
  canPause,
  onPlay,
  onPause,
  onNextPeriod,
  pendingEventsCount = 0,
  onOpenEvents,
}) {
  const progressFrac = periodProgressFrac(periodDurationSeconds, remainingSeconds);
  const progressPct = Math.round(progressFrac * 100);

  return (
    <header className="mqx-hero mqx-hero--compact" data-onboarding-anchor="hero">
      <div className="mqx-hero__glow" aria-hidden />

      <div className="mqx-hero-compact__row1">
        <div className="mqx-hero-compact__logo" aria-hidden>
          <BrandLogo variant="compact" />
        </div>

        <div className="mqx-hero-compact__center">
          <div className="mqx-hero-compact__timer-row">
            <span className="mqx-hero-compact__timer" aria-live="polite">
              {timerValue}
            </span>
            <span className="mqx-hero-compact__progress-meta">
              {timerLabel}
              {' '}
              · {progressPct}%
            </span>
          </div>
          <div
            className="mqx-hero-compact__progress"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Прогресс периода"
          >
            <div
              className="mqx-hero-compact__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mqx-hero-compact__controls">
          <MqxButton
            variant="hero-filled"
            className="mqx-btn--icon"
            disabled={!canPlay}
            aria-label="Играть"
            onClick={onPlay}
          >
            ▶
          </MqxButton>
          <MqxButton
            variant="hero-filled"
            className="mqx-btn--icon"
            disabled={!canPause}
            aria-label="Пауза"
            onClick={onPause}
          >
            <span className="mqx-hero-icon-pause" aria-hidden>
              <span />
              <span />
            </span>
          </MqxButton>
        </div>
      </div>

      <div className="mqx-hero-compact__row2">
        <div className="mqx-hero-compact__period">
          <span className="mqx-hero-compact__period-label">Период</span>
          <span className="mqx-hero-compact__period-value">#{periodIndex}</span>
        </div>

        <div className="mqx-hero-compact__row2-actions">
          {onOpenEvents ? (
            <MqxPill
              events
              badge={pendingEventsCount > 0 ? pendingEventsCount : undefined}
              onClick={onOpenEvents}
            >
              События
            </MqxPill>
          ) : null}
          <MqxPill
            onClick={onNextPeriod}
            data-onboarding-anchor="next_period"
            title="Закрыть текущий период и перейти к следующему"
            aria-label="Следующий период"
          >
            Следующий период
          </MqxPill>
        </div>
      </div>
    </header>
  );
}
