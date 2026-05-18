import { truncateEventText } from './eventDisplay';

/** Кнопка выбора в карточке события. */
export function EventChoiceButton({ choice, disabled, onPick }) {
  return (
    <button
      type="button"
      className="mqx-events-choice"
      disabled={disabled}
      onClick={() => { void onPick(choice.id); }}
    >
      <span className="mqx-events-choice__title">{truncateEventText(choice.title, 96)}</span>
      {choice.description ? (
        <span className="mqx-events-choice__desc">{truncateEventText(choice.description, 180)}</span>
      ) : null}
    </button>
  );
}
