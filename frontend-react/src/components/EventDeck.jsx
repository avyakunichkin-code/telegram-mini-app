import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { showNotification } from './notifications';

function truncate(str, len) {
  if (!str) return '';
  return str.length <= len ? str : `${str.slice(0, len - 1)}…`;
}

function EventChoicesCard({ event, onPick, busyId }) {
  const disabled = busyId !== null;
  const choices = event.choices || [];

  return (
    <div className="mqx-events-card event-deck-card">
      <div className="mqx-events-card__kicker">
        Период #{event.period_index}
        {(event.idxInDeck != null && event.deckLen != null) ? (
          <span className="mqx-events-card__kicker-sep">
            карточка {event.idxInDeck + 1} из {event.deckLen}
          </span>
        ) : null}
      </div>
      <div className="mqx-events-card__title">{event.title}</div>
      <div className="mqx-events-card__desc">{event.description}</div>
      <div className="mqx-events-card__choices">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className="mqx-events-choice"
            disabled={disabled}
            onClick={() => { void onPick(event.id, c.id); }}
          >
            <span className="mqx-events-choice__title">{truncate(c.title, 96)}</span>
            {c.description ? (
              <span className="mqx-events-choice__desc">{truncate(c.description, 180)}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EventsTriggerButton({ count, open, onOpen }) {
  if (count <= 0) return null;
  return (
    <div className="tma-events-trigger-wrap">
      <Button size="s" mode={open ? 'filled' : 'outline'} className="tma-events-trigger" onClick={onOpen}>
        События
        <span className="tma-events-badge" aria-hidden>
          {count}
        </span>
      </Button>
    </div>
  );
}

const CAROUSEL_EDGE = 52;
const SLIDE_MS = 290;

/** Полный экран над игрой; карточки переключаются стрелками / свайпом (новая выезжает поверх текущей). Закрытие — только ×. */
export function EventCarouselOverlay({ open, onClose, events, onResolved }) {
  const [idx, setIdx] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [slide, setSlide] = useState(null);
  const animLock = useRef(false);
  const touchStart = useRef(null);
  const slideTimer = useRef(null);

  const rawList = Array.isArray(events) ? events : [];
  const n = rawList.length;
  const list = rawList.map((ev, i) => ({
    ...ev,
    idxInDeck: i,
    deckLen: n,
  }));

  const clearSlideTimer = () => {
    if (slideTimer.current) {
      window.clearTimeout(slideTimer.current);
      slideTimer.current = null;
    }
  };

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  useEffect(() => {
    setIdx((i) => (n === 0 ? 0 : Math.min(Math.max(i, 0), n - 1)));
  }, [n]);

  useEffect(() => () => clearSlideTimer(), []);

  const finalizeSlide = useCallback((enterIdx) => {
    clearSlideTimer();
    setIdx(enterIdx);
    setSlide(null);
    animLock.current = false;
  }, []);

  const startSlide = useCallback(
    (dir, enterIdx) => {
      if (busyId !== null || animLock.current || n === 0) return;
      if (enterIdx < 0 || enterIdx >= n) return;
      animLock.current = true;
      setSlide({ dir, enterIdx });
      clearSlideTimer();
      slideTimer.current = window.setTimeout(() => finalizeSlide(enterIdx), SLIDE_MS);
    },
    [busyId, n, finalizeSlide],
  );

  const goNext = useCallback(() => {
    if (idx >= n - 1) return;
    startSlide('next', idx + 1);
  }, [idx, n, startSlide]);

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    startSlide('prev', idx - 1);
  }, [idx, startSlide]);

  const onViewportTouchStart = (e) => {
    if (busyId !== null || slide || animLock.current) return;
    if (e.target.closest('button, a, [role="button"]')) return;
    touchStart.current = e.touches[0].clientX;
  };

  const onViewportTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (start === null || slide || busyId !== null) return;
    const end = e.changedTouches[0]?.clientX;
    if (end === undefined) return;
    const dx = end - start;
    if (Math.abs(dx) < CAROUSEL_EDGE) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const handlePick = async (eventInstanceId, choiceId) => {
    setBusyId(eventInstanceId);
    try {
      await onResolved(eventInstanceId, choiceId);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось применить выбор', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const onDotActivate = useCallback(
    (i) => {
      if (busyId !== null || slide || animLock.current) return;
      if (i === idx) return;
      startSlide(i > idx ? 'next' : 'prev', i);
    },
    [busyId, idx, slide, startSlide],
  );

  useEffect(() => {
    if (n === 0 && open) onClose();
  }, [n, open, onClose]);

  if (!open || n === 0) return null;

  const current = list[idx];
  const entering = slide ? list[slide.enterIdx] : null;

  return (
    <div
      className="mqx-events-overlay events-overlay-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="events-overlay-title"
    >
      <div className="mqx-events-backdrop events-overlay-backdrop" />

      <div className="mqx-events-panel events-overlay-panel">
        <div className="mqx-events-toolbar events-overlay-toolbar">
          <div className="mqx-events-toolbar__text events-overlay-toolbar__left">
            <span id="events-overlay-title" className="mqx-events-title events-overlay-title">
              События периода
            </span>
            <span className="mqx-events-sub events-overlay-tagline">
              Эффекты применяются сразу после выбора; при нехватке средств сервер вернёт ошибку. Окно можно закрыть «×» —
              нерешённые карточки остаются доступными из кнопки «События».
            </span>
          </div>
          <button type="button" className="mqx-events-close events-overlay-close" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>

        {n > 1 ? (
          <div className="mqx-events-dots events-carousel-dots">
            {list.map((ev, i) => (
              <button
                key={ev.id}
                type="button"
                className={`mqx-events-dot events-carousel-dot ${i === idx && !slide ? 'events-carousel-dot--active' : ''}`}
                aria-label={`Карточка ${i + 1}`}
                aria-current={i === idx && !slide ? 'step' : undefined}
                disabled={!!slide || busyId !== null}
                onClick={() => onDotActivate(i)}
              />
            ))}
          </div>
        ) : null}

        <div
          className="mqx-events-viewport event-carousel-viewport"
          onTouchStart={onViewportTouchStart}
          onTouchEnd={onViewportTouchEnd}
          onTouchCancel={() => { touchStart.current = null; }}
        >
          {current ? (
            <div
              className={`event-carousel-layer event-carousel-layer--base ${slide ? 'event-carousel-layer--dim' : ''}`}
              aria-hidden={!!slide}
            >
              <EventChoicesCard event={current} onPick={handlePick} busyId={busyId} />
            </div>
          ) : null}

          {entering ? (
            <div
              key={`${entering.id}-${slide.dir}-${slide.enterIdx}`}
              className={`event-carousel-layer event-carousel-layer--top event-carousel-layer--enter-${slide.dir}`}
            >
              <EventChoicesCard event={entering} onPick={handlePick} busyId={busyId} />
            </div>
          ) : null}
        </div>

        <div className="mqx-events-nav events-carousel-nav">
          <button
            type="button"
            className="mqx-events-arrow events-carousel-arrow"
            aria-label="Предыдущая карточка"
            disabled={idx <= 0 || !!slide || busyId !== null}
            onClick={() => goPrev()}
          >
            ‹
          </button>
          <span className="mqx-events-counter events-carousel-counter">
            {idx + 1} / {n}
          </span>
          <button
            type="button"
            className="mqx-events-arrow events-carousel-arrow"
            aria-label="Следующая карточка"
            disabled={idx >= n - 1 || !!slide || busyId !== null}
            onClick={() => goNext()}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
