import { FINISH_TURN_BUTTON, TURN_SINGULAR } from '../../../constants/turnCopy';
import { MoneyText } from '../../MoneyText';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { eventsPlateHint, eventsPlateTitle } from '../utils/boardDashDisplay';

function EventsPlate({ count, onOpen }) {
  const n = Math.max(0, Number(count) || 0);
  return (
    <button
      type="button"
      className={['mqx-bg-btn', 'mqx-bg-events', n === 0 && 'mqx-bg-events--done'].filter(Boolean).join(' ')}
      onClick={onOpen}
      data-onboarding-anchor="events"
    >
      <span className="mqx-bg-deck" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="mqx-bg-events__text">
        <b className="mqx-bg-events__title">{eventsPlateTitle(n)}</b>
        <small className="mqx-bg-events__hint">{eventsPlateHint(n)}</small>
      </span>
      <span className="mqx-bg-events__go" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

function rubAria(n) {
  return `${Math.abs(Math.round(Number(n) || 0)).toLocaleString('ru-RU')} руб.`;
}

/**
 * Превью конца хода ★ close-preview-round A (PR-07): «Спишется N ₽ · останется M ₽» под кнопкой.
 * Минус после хода — красным; третий минус подряд — плашка о поражении.
 */
function ClosePreview({ preview }) {
  const { charges, after, negative, defeat } = preview;
  const afterText = `${negative ? 'минус ' : ''}${rubAria(after)}`;
  return (
    <>
      <p
        id="mqx-close-preview"
        className="mqx-bg-close-preview"
        aria-label={`В конце хода спишется ${rubAria(charges)}, на счёте останется ${afterText}`}
      >
        <span>
          Спишется{' '}
          <b>
            <MoneyText value={charges} decimals={0} />
          </b>
        </span>
        <span aria-hidden="true">·</span>
        <span className={negative ? 'mqx-bg-close-preview__risk' : undefined}>
          останется{' '}
          <b>
            {after < 0 ? '−' : ''}
            <MoneyText value={Math.abs(after)} decimals={0} />
          </b>
        </span>
      </p>
      {defeat ? (
        <p className="mqx-bg-close-defeat" role="alert">
          Третий минус подряд — игра закончится
        </p>
      ) : null}
    </>
  );
}

/**
 * Карта хода ★ BG-1 (ADR-014): роль и «Твой ход» слева, номер хода справа (ходов не ограничено),
 * плашка событий → Монетка одной строкой → компактная «Завершить ход» → превью списания (PR-07).
 * `closePreview` — из `closePreviewView(overview.period_close_preview)`; null — строки нет.
 */
export function MqxDashboardHero({
  roleTitle = 'Игрок',
  periodIndex,
  onCloseMonth,
  closeMonthDisabled = false,
  pendingEventsCount = 0,
  onOpenEvents,
  tip = null,
  closePreview = null,
}) {
  const turn = Number(periodIndex) || 0;

  return (
    <header className="mqx-bg-turn" data-onboarding-anchor="hero">
      <div className="mqx-bg-turn__top">
        <div className="mqx-bg-turn__who">
          <span className="mqx-bg-turn__role">{roleTitle}</span>
          <h1 className="mqx-bg-turn__title">Твой ход</h1>
        </div>
        <p className="mqx-bg-turn__num">
          <span className="mqx-bg-sr-only">{`${TURN_SINGULAR} ${turn}`}</span>
          <span aria-hidden="true">{turn}</span>
          <small aria-hidden="true">ход</small>
        </p>
      </div>

      {onOpenEvents ? <EventsPlate count={pendingEventsCount} onOpen={onOpenEvents} /> : null}

      {tip?.text ? (
        <p className="mqx-bg-tip" data-tone={tip.tone || 'normal'} title={tip.text}>
          <MonetkaAvatar size={26} className="mqx-bg-tip__monetka" />
          <span className="mqx-bg-tip__text">{tip.text}</span>
        </p>
      ) : null}

      <button
        type="button"
        className="mqx-bg-btn mqx-bg-cta"
        disabled={closeMonthDisabled}
        onClick={onCloseMonth}
        data-onboarding-anchor="next_period"
        aria-label="Завершить ход и перейти к следующему"
        aria-describedby={closePreview ? 'mqx-close-preview' : undefined}
      >
        {FINISH_TURN_BUTTON}
      </button>

      {closePreview ? <ClosePreview preview={closePreview} /> : null}
    </header>
  );
}
