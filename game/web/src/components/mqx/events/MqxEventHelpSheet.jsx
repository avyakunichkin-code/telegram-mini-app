import { EVENT_HELP_SECTIONS, EVENT_HELP_TITLE } from '../../../guidance/eventHelpGuide';
import { MqxButton } from '../primitives/MqxButton';

function renderInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Справочник «?» в оверлее событий — не часть curriculum. */
export function MqxEventHelpSheet({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="mqx-sheet-root mqx-event-help-root" role="presentation">
      <button type="button" className="mqx-sheet-scrim" aria-label="Закрыть справку" onClick={onClose} />
      <section
        className="mqx-sheet mqx-event-help-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-event-help-title"
      >
        <button type="button" className="mqx-sheet__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="mqx-event-help-title" className="mqx-sheet__title">
          {EVENT_HELP_TITLE}
        </h2>
        <p className="mqx-sheet__sub mqx-event-help-sheet__lead">
          Оказывается, тут много подсказок сразу — разберём по частям.
        </p>

        <div className="mqx-sheet__body">
          {EVENT_HELP_SECTIONS.map((block) => (
            <div key={block.heading} className="mqx-sheet__section">
              <h3 className="mqx-sheet__h3">{block.heading}</h3>
              <ul className="mqx-sheet__list">
                {block.items.map((item) => (
                  <li key={item}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mqx-sheet__actions">
          <MqxButton stretched onClick={onClose}>
            Понятно
          </MqxButton>
        </div>
      </section>
    </div>
  );
}
