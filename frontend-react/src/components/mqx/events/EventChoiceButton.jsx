import { useId } from 'react';
import { asSafeReactText } from '../../../utils/displayText';
import { MqxChoiceConsequences } from './MqxChoiceConsequences';

/** ★ BG-2: выбор в карте события — плоская кнопка с чипами последствий. */
export function EventChoiceButton({ choice, disabled, onPick }) {
  const consequencesId = useId();
  const choiceLabel = asSafeReactText(choice?.title, 'Вариант ответа');
  const description = choice?.description ? asSafeReactText(choice.description, '') : '';

  return (
    <button
      type="button"
      className="mqx-events-choice mqx-events-choice--flat"
      disabled={disabled}
      title={choiceLabel}
      aria-label={description ? `${choiceLabel}. ${description}` : choiceLabel}
      aria-describedby={consequencesId}
      onClick={() => { void onPick(choice.id); }}
    >
      <span className="mqx-events-choice__title">{choiceLabel}</span>
      {description ? <span className="mqx-events-choice__desc">{description}</span> : null}
      <span id={consequencesId}><MqxChoiceConsequences choice={choice} /></span>
    </button>
  );
}
