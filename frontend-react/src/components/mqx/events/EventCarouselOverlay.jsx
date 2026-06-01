import { useEffect, useState } from 'react';
import { showNotification } from '../../notifications';
import { EventCard } from './EventCard';
import { EventCarouselNav } from './EventCarouselNav';
import { useEventCarousel } from './useEventCarousel';

/**
 * Полноэкранный оверлей событий: карточка L3, свайп, навигация внизу.
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
    onViewportTouchStart,
    onViewportTouchEnd,
    onViewportTouchCancel,
    canNavigate,
  } = carousel;

  const navBlocked = !!slide || busyId !== null;
  const titleId = 'mqx-event-overlay-title';

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const root = document.getElementById('root');
    const prevBody = body.style.overflow;
    const prevRoot = root?.style.overflow ?? '';
    body.classList.add('mqx-events-overlay-open');
    body.style.overflow = 'hidden';
    if (root) root.style.overflow = 'hidden';
    return () => {
      body.classList.remove('mqx-events-overlay-open');
      body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, [open]);

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
      aria-labelledby={titleId}
    >
      <div className="mqx-events-backdrop events-overlay-backdrop" aria-hidden />

      <div className="mqx-events-panel events-overlay-panel mqx-events-panel--l3">
        <div
          className={[
            'mqx-events-viewport',
            'event-carousel-viewport',
            slide && 'event-carousel-viewport--sliding',
          ]
            .filter(Boolean)
            .join(' ')}
          onTouchStart={(e) => onViewportTouchStart(e, navBlocked)}
          onTouchEnd={(e) => onViewportTouchEnd(e, navBlocked)}
          onTouchCancel={onViewportTouchCancel}
        >
          {current ? (
            <div
              className={`event-carousel-layer event-carousel-layer--base ${slide ? 'event-carousel-layer--dim' : ''}`}
              aria-hidden={!!slide}
            >
              <EventCard
                event={current}
                busyId={busyId}
                onPick={handlePick}
                onClose={onClose}
                titleId={titleId}
              />
            </div>
          ) : null}

          {entering ? (
            <div
              key={`${entering.id}-${slide.dir}-${slide.enterIdx}`}
              className={`event-carousel-layer event-carousel-layer--top event-carousel-layer--enter-${slide.dir}`}
            >
              <EventCard
                event={entering}
                busyId={busyId}
                onPick={handlePick}
                onClose={onClose}
                titleId={titleId}
              />
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
