import { asSafeReactText } from '../../../utils/displayText';
import { MqxDivider } from '../primitives/MqxDivider';
import { EventChoiceButton } from './EventChoiceButton';
import { choiceHasInsuranceClaim, eventHasInsuranceClaimChoice } from './eventDisplay';

/**
 * Карточка события (flat B′): период, заголовок, описание, выборы.
 */
export function EventCard({ event, busyId, onPick }) {
  const disabled = busyId !== null;
  const choices = event?.choices || [];
  const insuranceEvent = eventHasInsuranceClaimChoice(event);

  return (
    <article className={`mqx-events-card mqx-events-card--flat${insuranceEvent ? ' mqx-events-card--insurance' : ''}`}>
      {insuranceEvent ? (
        <span className="mqx-events-card__badge">Страховой случай</span>
      ) : null}
      <div className={`mqx-events-card__kicker${insuranceEvent ? ' mqx-events-card__kicker--insurance' : ''}`}>
        Период #{event.period_index}
        {event.idxInDeck != null && event.deckLen != null ? (
          <span className="mqx-events-card__kicker-sep">
            {' '}
            · карточка {event.idxInDeck + 1} из {event.deckLen}
          </span>
        ) : null}
      </div>
      <h3 className="mqx-events-card__title">{asSafeReactText(event.title)}</h3>
      <p className="mqx-events-card__desc">{asSafeReactText(event.description)}</p>

      <MqxDivider className="mqx-events-card__divider" />

      <div className="mqx-events-card__choices" role="group" aria-label="Варианты решения">
        {choices.map((c) => (
          <EventChoiceButton
            key={c.id}
            choice={c}
            disabled={disabled}
            variant={choiceHasInsuranceClaim(c) ? 'primary' : 'default'}
            onPick={(choiceId) => onPick(event.id, choiceId)}
          />
        ))}
      </div>
    </article>
  );
}
