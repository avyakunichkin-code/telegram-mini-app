import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { showNotification } from './notifications';

function truncate(str, len) {
  if (!str) return '';
  return str.length <= len ? str : `${str.slice(0, len - 1)}…`;
}

function BinaryEventCard({ event, onPick, disabled }) {
  const c0 = event.choices[0];
  const c1 = event.choices[1];

  return (
    <div className="event-deck-card tma-bordered-inner">
      <div className="event-deck-card__meta">Период #{event.period_index}</div>
      <div className="event-deck-card__title">{event.title}</div>
      <div className="event-deck-card__desc">{event.description}</div>
      <p className="event-deck-choice-hint">
        Первое действие — зелёная кнопка, второе — красная.
      </p>
      <div className="event-deck-actions">
        <button
          type="button"
          className="tma-choice-btn tma-choice-btn--no"
          disabled={disabled}
          onClick={() => { void onPick(event.id, c1.id); }}
        >
          {truncate(c1.title, 64)}
        </button>
        <button
          type="button"
          className="tma-choice-btn tma-choice-btn--yes"
          disabled={disabled}
          onClick={() => { void onPick(event.id, c0.id); }}
        >
          {truncate(c0.title, 64)}
        </button>
      </div>
    </div>
  );
}

function PolyEventCard({ event, onPick, disabled }) {
  return (
    <div className="event-deck-card tma-bordered-inner">
      <div className="event-deck-card__meta">Период #{event.period_index}</div>
      <div className="event-deck-card__title">{event.title}</div>
      <div className="event-deck-card__desc">{event.description}</div>
      <div className="event-deck-poly">
        {event.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className="tma-choice-btn tma-choice-btn--outline"
            disabled={disabled}
            onClick={() => { void onPick(event.id, c.id); }}
          >
            <span style={{ fontWeight: 650 }}>{c.title}</span>
            {c.description ? <span style={{ opacity: 0.8, marginTop: 4, display: 'block' }}>{c.description}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function EventCardInner({ event, onPick, busyId }) {
  const disabled = busyId !== null;
  const n = event.choices?.length ?? 0;
  if (n === 2) {
    return <BinaryEventCard event={event} onPick={onPick} disabled={disabled} />;
  }
  return <PolyEventCard event={event} onPick={onPick} disabled={disabled} />;
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

  const list = Array.isArray(events) ? events : [];
  const n = list.length;

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
    <div className="events-overlay-root" role="dialog" aria-modal="true" aria-labelledby="events-overlay-title">
      <div className="events-overlay-backdrop" />

      <div className="events-overlay-panel">
        <div className="events-overlay-toolbar">
          <div className="events-overlay-toolbar__left">
            <span id="events-overlay-title" className="events-overlay-title">
              Ситуации месяца
            </span>
          </div>
          <button type="button" className="events-overlay-close" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>

        {n > 1 ? (
          <div className="events-carousel-dots">
            {list.map((ev, i) => (
              <button
                key={ev.id}
                type="button"
                className={`events-carousel-dot ${i === idx && !slide ? 'events-carousel-dot--active' : ''}`}
                aria-label={`Ситуация ${i + 1}`}
                aria-current={i === idx && !slide ? 'step' : undefined}
                disabled={!!slide || busyId !== null}
                onClick={() => onDotActivate(i)}
              />
            ))}
          </div>
        ) : null}

        <div
          className="event-carousel-viewport"
          onTouchStart={onViewportTouchStart}
          onTouchEnd={onViewportTouchEnd}
          onTouchCancel={() => { touchStart.current = null; }}
        >
          {current ? (
            <div
              className={`event-carousel-layer event-carousel-layer--base ${slide ? 'event-carousel-layer--dim' : ''}`}
              aria-hidden={!!slide}
            >
              <EventCardInner event={current} onPick={handlePick} busyId={busyId} />
            </div>
          ) : null}

          {entering ? (
            <div
              key={`${entering.id}-${slide.dir}-${slide.enterIdx}`}
              className={`event-carousel-layer event-carousel-layer--top event-carousel-layer--enter-${slide.dir}`}
            >
              <EventCardInner event={entering} onPick={handlePick} busyId={busyId} />
            </div>
          ) : null}
        </div>

        <div className="events-carousel-nav">
          <button
            type="button"
            className="events-carousel-arrow"
            aria-label="Предыдущая карточка"
            disabled={idx <= 0 || !!slide || busyId !== null}
            onClick={() => goPrev()}
          >
            ‹
          </button>
          <span className="events-carousel-counter">
            {idx + 1} / {n}
          </span>
          <button
            type="button"
            className="events-carousel-arrow"
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
