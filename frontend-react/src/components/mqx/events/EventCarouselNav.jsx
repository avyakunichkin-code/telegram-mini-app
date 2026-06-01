/** Навигация карусели внизу оверлея: стрелки и счётчик. */
export function EventCarouselNav({
  index,
  total,
  canPrev,
  canNext,
  disabled,
  onPrev,
  onNext,
}) {
  const showCounter = total > 1;

  return (
    <div className="mqx-events-nav events-carousel-nav mqx-events-nav--l3">
      <button
        type="button"
        className="mqx-events-arrow events-carousel-arrow"
        aria-label="Предыдущая карточка"
        disabled={!canPrev || disabled}
        onClick={onPrev}
      >
        ‹
      </button>
      {showCounter ? (
        <span className="mqx-events-counter events-carousel-counter" aria-live="polite">
          {index + 1} / {total}
        </span>
      ) : (
        <span className="mqx-events-nav__gap" aria-hidden />
      )}
      <button
        type="button"
        className="mqx-events-arrow events-carousel-arrow"
        aria-label="Следующая карточка"
        disabled={!canNext || disabled}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  );
}
