import { asSafeReactText } from '../../../utils/displayText';
import { truncateEventText } from './eventDisplay';
import { EventChoiceImpacts } from './EventChoiceImpacts';

/** Кнопка выбора в карточке события (flat, без цветового акцента). */
export function EventChoiceButton({ choice, disabled, onPick }) {
  const hasImpacts = Array.isArray(choice?.impacts) && choice.impacts.length > 0;
  const choiceLabel = asSafeReactText(choice?.title, 'Вариант ответа');

  return (
    <button
      type="button"
      className="mqx-events-choice mqx-events-choice--flat"
      disabled={disabled}
      title={choiceLabel}
      aria-label={choice.description ? `${choiceLabel}. ${asSafeReactText(choice.description, '')}` : choiceLabel}
      onClick={() => { void onPick(choice.id); }}
    >
      <span className="mqx-events-choice__title">{truncateEventText(choice.title, 96)}</span>
      {hasImpacts ? <EventChoiceImpacts impacts={choice.impacts} /> : null}
      {choice.description ? (
        <span className="mqx-events-choice__desc">
          {truncateEventText(choice.description, 180)}
        </span>
      ) : null}
    </button>
  );
}
