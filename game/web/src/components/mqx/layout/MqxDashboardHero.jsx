import { useEffect, useRef } from 'react';
import { FINISH_TURN_BUTTON, TURN_SINGULAR } from '../../../constants/turnCopy';
import { BrandLogo } from '../../BrandLogo';
import { MoneyText } from '../../MoneyText';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { MqxButton } from '../primitives/MqxButton';
import { eventsPlateHint, eventsPlateTitle } from '../utils/boardDashDisplay';

export function EventsPlate({ count, onOpen }) {
  const n = Math.max(0, Number(count) || 0);
  return (
    <button
      type="button"
      className={['mqx-bg-btn', 'mqx-bg-events', n === 0 && 'mqx-bg-events--done'].filter(Boolean).join(' ')}
      onClick={onOpen}
      data-onboarding-anchor="events"
      aria-label={`${eventsPlateTitle(n)} — ${eventsPlateHint(n)}`}
    >
      <span className="mqx-bg-events__calendar" aria-hidden="true" />
      <b className="mqx-bg-events__title">События</b>
      <span className="mqx-bg-events__text">
        <b className="mqx-bg-events__count">{n}</b>
        <small className="mqx-bg-events__hint">{n ? 'осталось' : 'решены'}</small>
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
        <span className={negative ? 'mqx-bg-close-preview__risk' : undefined}>
          Останется{' '}
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

export function DashboardFinish({ onClose, disabled, preview }) {
  return (
    <>
      <MqxButton
        variant="turn"
        className="mqx-bg-btn mqx-bg-cta"
        disabled={disabled}
        onClick={onClose}
        data-onboarding-anchor="next_period"
        aria-label="Завершить ход и перейти к следующему"
        aria-describedby={preview ? 'mqx-close-preview' : undefined}
      >
        {FINISH_TURN_BUTTON}
      </MqxButton>
      {preview ? <ClosePreview preview={preview} /> : null}
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
  balanceHighlight = false,
}) {
  const turn = Number(periodIndex) || 0;
  const hasCampusScene = templateKey === 'mq_game_basic_v1';
  const helpRef = useRef(null);
  useEffect(() => {
    helpRef.current?.close();
  }, [tip?.text, turn]);

  return (
    <header className={`mqx-bg-turn${hasCampusScene ? ' mqx-bg-turn--campus' : ''}`} data-onboarding-anchor="hero">
      <div className="mqx-bg-turn__top">
        <BrandLogo variant="finance-game" className="mqx-bg-turn__logo" />
        <div className="mqx-bg-turn__who">
          <h1 className="mqx-bg-turn__title">{TURN_SINGULAR} <b>{turn}</b></h1>
        </div>

      </div>

      <div className="mqx-bg-turn__balance">
        <div>
          <span>На счёте</span>
          <div className="mqx-bg-turn__balance-line">
            <strong className={balanceHighlight ? 'mqx-bg-turn__balance--gain' : undefined} data-mqx-juice-target="balance">
              <MoneyText value={balance ?? 0} decimals={0} />
            </strong>
            <button
              type="button"
              className="mqx-bg-turn__help"
              aria-label="Подсказка Монетки"
              aria-haspopup="dialog"
              disabled={!tip?.text}
              onClick={() => helpRef.current?.showModal()}
            >
              <MonetkaAvatar size={32} pose={tip?.pose} />
            </button>
          </div>
        </div>
        <div className="mqx-bg-turn__persona">
          <span className="mqx-bg-turn__role">{roleTitle}</span>
          {hasCampusScene ? null : <PersonaPortrait templateKey={templateKey} size="dash" />}
        </div>
      </div>
      <dialog ref={helpRef} className="mqx-bg-turn__dialog" aria-label="Подсказка Монетки">
        <p>{tip?.text}</p>
        <form method="dialog">
          <button type="submit" className="mqx-bg-btn mqx-bg-cta">Понятно</button>
        </form>
      </dialog>

      <DashboardFinish onClose={onCloseMonth} disabled={closeMonthDisabled} preview={closePreview} />
      {onOpenEvents ? <EventsPlate count={pendingEventsCount} onOpen={onOpenEvents} /> : null}
    </header>
  );
}
