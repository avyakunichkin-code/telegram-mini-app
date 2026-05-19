import { asSafeReactText } from '../../../utils/displayText';
import { truncateEventText } from './eventDisplay';

/** Кнопка выбора в карточке события (flat, без цветового акцента). */
export function EventChoiceButton({ choice, disabled, onPick }) {
  const xpHint = Number(choice?.xp_delta) > 0 ? `XP +${choice.xp_delta}` : null;
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
      {choice.description ? (
        <span className="mqx-events-choice__desc">
          {truncateEventText(choice.description, 180)}
          {xpHint ? ` · ${xpHint}` : ''}
        </span>
      ) : xpHint ? (
        <span className="mqx-events-choice__desc">{xpHint}</span>
      ) : null}
    </button>
  );
}
