import { useRef, useState } from 'react';
import { showNotification } from './notifications';

const SWIPE_PX = 56;

function truncate(str, len) {
  if (!str) return '';
  return str.length <= len ? str : `${str.slice(0, len - 1)}…`;
}

/** Карточка события с ровно двумя исходами: свайп ↔ и две наглядные кнопки. */
function BinaryEventCard({ event, onPick, disabled }) {
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);

  const c0 = event.choices[0];
  const c1 = event.choices[1];

  const commitSwipe = async (direction) => {
    if (disabled) return;
    const choiceId = direction >= 0 ? c0.id : c1.id;
    await onPick(event.id, choiceId);
  };

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const x = e.touches[0].clientX;
    const d = Math.max(-SWIPE_PX * 2, Math.min(SWIPE_PX * 2, x - startX.current));
    setOffset(d);
  };

  const onTouchEnd = () => {
    if (Math.abs(offset) >= SWIPE_PX) {
      void commitSwipe(offset);
    }
    startX.current = null;
    setOffset(0);
  };

  return (
    <div className="event-deck-card tma-bordered-inner">
      <div className="event-deck-card__meta">Период #{event.period_index}</div>
      <div className="event-deck-card__title">{event.title}</div>
      <div className="event-deck-card__desc">{event.description}</div>
      <div className="event-deck-swipe-area">
        <div className="event-deck-swipe-hint-left">← {truncate(c1.title, 28)}</div>
        <div className="event-deck-swipe-hint-right">{truncate(c0.title, 28)} →</div>
      </div>
      <div
        className="event-deck-surface"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="event-deck-surface__inner"
          style={{ transform: `translateX(${offset * 0.35}px)` }}
        >
          Свайп или кнопки
        </div>
        <div
          className="event-deck-surface__tint event-deck-surface__tint--no"
          style={{ opacity: offset < -24 ? Math.min(0.35, (-offset / SWIPE_PX) * 0.25) : 0 }}
        />
        <div
          className="event-deck-surface__tint event-deck-surface__tint--yes"
          style={{ opacity: offset > 24 ? Math.min(0.35, (offset / SWIPE_PX) * 0.25) : 0 }}
        />
      </div>
      <div className="event-deck-actions">
        <button
          type="button"
          className="tma-choice-btn tma-choice-btn--no"
          disabled={disabled}
          onClick={() => { void commitSwipe(-1); }}
        >
          {truncate(c1.title, 56)}
        </button>
        <button
          type="button"
          className="tma-choice-btn tma-choice-btn--yes"
          disabled={disabled}
          onClick={() => { void commitSwipe(1); }}
        >
          {truncate(c0.title, 56)}
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

export function EventDeck({ events, onResolved }) {
  const [busyId, setBusyId] = useState(null);

  if (!events || events.length === 0) return null;

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

  return (
    <section className="event-deck-shell tma-bordered-inner" aria-label="События периода">
      <div className="event-deck-shell__hdr">
        <span className="event-deck-shell__title">Ситуации месяца</span>
        <span className="event-deck-shell__count">{events.length}</span>
      </div>
      <p className="event-deck-shell__hint">
        Если два исхода: свайп вправо или зелёная кнопка — первое действие; влево или красная — второе.
      </p>
      <div className="event-deck-list">
        {events.map((ev) => (
          <div key={ev.id}>
            {(ev.choices?.length ?? 0) === 2 ? (
              <BinaryEventCard event={ev} onPick={handlePick} disabled={busyId !== null} />
            ) : (
              <PolyEventCard event={ev} onPick={handlePick} disabled={busyId !== null} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
