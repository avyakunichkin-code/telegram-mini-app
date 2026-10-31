/** ★ BG-2: стрелки карусели под картой. Счётчик — в строке колоды над картой. */
export function EventCarouselNav({
  canPrev,
  canNext,
  disabled,
  onPrev,
  onNext,
}) {
  return (
    <div className="mqx-events-nav events-carousel-nav mqx-events-nav--l3">
      <button
        type="button"
        className="mqx-events-arrow events-carousel-arrow"
        aria-label="Предыдущее событие"
        disabled={!canPrev || disabled}
        onClick={onPrev}
      >
        ‹
      </button>
      <button
        type="button"
        className="mqx-events-arrow events-carousel-arrow"
        aria-label="Следующее событие"
        disabled={!canNext || disabled}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  );
}
