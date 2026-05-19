const DEFAULT_TAGLINE =
  'Эффекты применяются сразу после выбора; при нехватке средств сервер вернёт ошибку. Окно можно закрыть «×» — нерешённые карточки остаются доступными из кнопки «События».';

/** Шапка оверлея событий: заголовок, подсказка, закрытие. */
export function EventOverlayToolbar({
  title = 'События периода',
  tagline = DEFAULT_TAGLINE,
  titleId = 'events-overlay-title',
  onClose,
}) {
  return (
    <div className="mqx-events-toolbar events-overlay-toolbar">
      <div className="mqx-events-toolbar__text events-overlay-toolbar__left">
        <span id={titleId} className="mqx-events-title events-overlay-title">
          {title}
        </span>
        <p className="mqx-events-sub events-overlay-tagline">{tagline}</p>
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
