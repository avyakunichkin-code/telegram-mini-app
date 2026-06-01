/** Точки навигации карусели событий. */
export function EventCarouselDots({ items, activeIndex, sliding, disabled, onActivate }) {
  if (!items?.length || items.length <= 1) return null;

  return (
    <div className="mqx-events-dots events-carousel-dots" role="tablist" aria-label="Карточки событий">
      {items.map((ev, i) => (
        <button
          key={ev.id}
          type="button"
          role="tab"
          className={`mqx-events-dot events-carousel-dot ${i === activeIndex && !sliding ? 'events-carousel-dot--active' : ''}`}
          aria-label={ev.title ? `Событие ${i + 1}: ${ev.title}` : `Карточка ${i + 1}`}
          title={ev.title ? String(ev.title) : undefined}
          aria-selected={i === activeIndex && !sliding}
          disabled={!!sliding || disabled}
          onClick={() => onActivate(i)}
        />
      ))}
    </div>
  );
}
