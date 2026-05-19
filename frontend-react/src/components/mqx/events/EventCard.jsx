import { asSafeReactText } from '../../../utils/displayText';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';
import { EventChoiceButton } from './EventChoiceButton';
import { eventHasInsuranceClaimChoice } from './eventDisplay';

/**
 * Карточка события M2: заголовок + описание в пузыре с Монеткой, flat-выборы без акцента.
 */
export function EventCard({ event, busyId, onPick }) {
  const disabled = busyId !== null;
  const choices = event?.choices || [];
  const insuranceEvent = eventHasInsuranceClaimChoice(event);
  const description = asSafeReactText(event.description);

  return (
    <article
      className={[
        'mqx-events-card',
        'mqx-events-card--m2',
        insuranceEvent && 'mqx-events-card--insurance',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mqx-events-card__head">
        <div className={`mqx-events-card__kicker${insuranceEvent ? ' mqx-events-card__kicker--insurance' : ''}`}>
          Период #{event.period_index}
          {event.idxInDeck != null && event.deckLen != null ? (
            <span className="mqx-events-card__kicker-sep">
              {' '}
              · карточка {event.idxInDeck + 1} из {event.deckLen}
            </span>
          ) : null}
        </div>
        {insuranceEvent ? (
          <span className="mqx-events-card__badge">Страховой случай</span>
        ) : null}
      </div>

      <h3 className="mqx-events-card__title mqx-events-card__title--m2">{asSafeReactText(event.title)}</h3>

      {description ? (
        <div className="mqx-events-card__bubble-row">
          <div className="mqx-events-card__monetka-wrap">
            <MonetkaAvatar size={50} className="mqx-events-card__monetka" />
          </div>
          <div className="mqx-events-card__bubble">
            <p className="mqx-events-card__bubble-text">{description}</p>
          </div>
        </div>
      ) : null}

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
