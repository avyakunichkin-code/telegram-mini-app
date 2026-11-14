import { useEffect, useRef } from 'react';
import { FINISH_TURN_BUTTON, TURN_SINGULAR } from '../../../constants/turnCopy';
import { BrandLogo } from '../../BrandLogo';
import { MoneyText } from '../../MoneyText';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { PersonaPortrait } from '../brand/PersonaPortrait';
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

export function MqxDashboardHero({
  roleTitle = 'Игрок',
  periodIndex,
  onCloseMonth,
  closeMonthDisabled = false,
  pendingEventsCount = 0,
  onOpenEvents,
  tip = null,
  closePreview = null,
  templateKey,
  balance,
}) {
  const turn = Number(periodIndex) || 0;
  const helpRef = useRef(null);
  useEffect(() => {
    helpRef.current?.close();
  }, [tip?.text, turn]);

  return (
    <header className="mqx-bg-turn" data-onboarding-anchor="hero">
      <div className="mqx-bg-turn__top">
        <BrandLogo variant="full" className="mqx-bg-turn__logo" />
        <div className="mqx-bg-turn__who">
          <span className="mqx-bg-turn__role">{roleTitle}</span>
          <h1 className="mqx-bg-turn__title">{`${TURN_SINGULAR} ${turn}`}</h1>
        </div>
        <button
          type="button"
          className="mqx-bg-turn__help"
          aria-label="Подсказка Монетки"
          aria-haspopup="dialog"
          disabled={!tip?.text}
          onClick={() => helpRef.current?.showModal()}
        >
          <MonetkaAvatar size={32} />
        </button>
      </div>

      <div className="mqx-bg-turn__balance">
        <div>
          <span>На счёте</span>
          <strong><MoneyText value={balance ?? 0} decimals={0} /></strong>
        </div>
        <PersonaPortrait templateKey={templateKey} size="dash" />
      </div>
      <dialog ref={helpRef} className="mqx-bg-turn__dialog" aria-label="Подсказка Монетки">
        <p>{tip?.text}</p>
        <form method="dialog">
          <button type="submit" className="mqx-bg-btn mqx-bg-cta">Понятно</button>
        </form>
      </dialog>

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
      {onOpenEvents ? <EventsPlate count={pendingEventsCount} onOpen={onOpenEvents} /> : null}
    </header>
  );
}
