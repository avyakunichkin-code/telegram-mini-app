/** Шапка оверлея L3: заголовок, опционально счётчик карточек, закрытие. */
export function EventOverlayToolbar({
  title = 'События',
  progress,
  titleId = 'events-overlay-title',
  onClose,
}) {
  return (
    <div className="mqx-events-toolbar events-overlay-toolbar mqx-events-toolbar--l3">
      <div className="mqx-events-toolbar__main events-overlay-toolbar__left">
        <span id={titleId} className="mqx-events-title events-overlay-title">
          {title}
        </span>
        {progress ? (
          <span className="mqx-events-toolbar__progress" aria-live="polite">
            {progress}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="mqx-events-close events-overlay-close"
        aria-label="Закрыть окно событий"
        title="Закрыть"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
