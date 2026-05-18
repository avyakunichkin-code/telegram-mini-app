import { asSafeReactText } from '../../../utils/displayText';
import { EventChoiceButton } from './EventChoiceButton';

/**
 * Карточка события: период, заголовок, описание, список выборов.
 * @param {object} event — id, period_index, title, description, choices[], idxInDeck?, deckLen?
 */
export function EventCard({ event, busyId, onPick }) {
  const disabled = busyId !== null;
  const choices = event?.choices || [];

  return (
    <article className="mqx-events-card event-deck-card">
      <div className="mqx-events-card__kicker">
        Период #{event.period_index}
        {event.idxInDeck != null && event.deckLen != null ? (
          <span className="mqx-events-card__kicker-sep">
            карточка {event.idxInDeck + 1} из {event.deckLen}
          </span>
        ) : null}
      </div>
      <h3 className="mqx-events-card__title">{asSafeReactText(event.title)}</h3>
      <p className="mqx-events-card__desc">{asSafeReactText(event.description)}</p>
      <div className="mqx-events-card__choices" role="group" aria-label="Варианты решения">
        {choices.map((c) => (
          <EventChoiceButton
            key={c.id}
            choice={c}
            disabled={disabled}
            onPick={(choiceId) => onPick(event.id, choiceId)}
          />
        ))}
      </div>
    </article>
  );
}
