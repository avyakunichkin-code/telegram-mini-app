/** Стрелки и счётчик карусели событий. */
export function EventCarouselNav({
  index,
  total,
  canPrev,
  canNext,
  disabled,
  onPrev,
  onNext,
}) {
  return (
    <div className="mqx-events-nav events-carousel-nav">
      <button
        type="button"
        className="mqx-events-arrow events-carousel-arrow"
        aria-label="Предыдущая карточка"
        disabled={!canPrev || disabled}
        onClick={onPrev}
      >
        ‹
      </button>
      <span className="mqx-events-counter events-carousel-counter">
        {index + 1} / {total}
      </span>
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
