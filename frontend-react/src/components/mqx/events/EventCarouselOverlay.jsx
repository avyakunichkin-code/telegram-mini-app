import { useState } from 'react';
import { showNotification } from '../../notifications';
import { EventCard } from './EventCard';
import { EventCarouselDots } from './EventCarouselDots';
import { EventCarouselNav } from './EventCarouselNav';
import { EventOverlayToolbar } from './EventOverlayToolbar';
import { useEventCarousel } from './useEventCarousel';

/**
 * Полноэкранный оверлей событий периода: карусель карточек, свайп, выбор.
 */
export function EventCarouselOverlay({ open, onClose, events, onResolved }) {
  const [busyId, setBusyId] = useState(null);

  const carousel = useEventCarousel(events, {
    open,
    onClose,
    navigationLocked: busyId !== null,
  });
  const {
    list,
    n,
    idx,
    slide,
    current,
    entering,
    goNext,
    goPrev,
    onDotActivate,
    onViewportTouchStart,
    onViewportTouchEnd,
    onViewportTouchCancel,
    canNavigate,
  } = carousel;

  const navBlocked = !!slide || busyId !== null;

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

  if (!open || n === 0) return null;

  return (
    <div
      className="mqx-events-overlay events-overlay-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="events-overlay-title"
    >
      <div className="mqx-events-backdrop events-overlay-backdrop" aria-hidden />

      <div className="mqx-events-panel events-overlay-panel">
        <EventOverlayToolbar onClose={onClose} />

        <EventCarouselDots
          items={list}
          activeIndex={idx}
          sliding={!!slide}
          disabled={navBlocked}
          onActivate={onDotActivate}
        />

        <div
          className="mqx-events-viewport event-carousel-viewport"
          onTouchStart={(e) => onViewportTouchStart(e, navBlocked)}
          onTouchEnd={(e) => onViewportTouchEnd(e, navBlocked)}
          onTouchCancel={onViewportTouchCancel}
        >
          {current ? (
            <div
              className={`event-carousel-layer event-carousel-layer--base ${slide ? 'event-carousel-layer--dim' : ''}`}
              aria-hidden={!!slide}
            >
              <EventCard event={current} busyId={busyId} onPick={handlePick} />
            </div>
          ) : null}

          {entering ? (
            <div
              key={`${entering.id}-${slide.dir}-${slide.enterIdx}`}
              className={`event-carousel-layer event-carousel-layer--top event-carousel-layer--enter-${slide.dir}`}
            >
              <EventCard event={entering} busyId={busyId} onPick={handlePick} />
            </div>
          ) : null}
        </div>

        <EventCarouselNav
          index={idx}
          total={n}
          canPrev={idx > 0 && canNavigate}
          canNext={idx < n - 1 && canNavigate}
          disabled={navBlocked}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
