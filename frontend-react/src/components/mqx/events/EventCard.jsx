import { asSafeReactText } from '../../../utils/displayText';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';
import { EventChoiceButton } from './EventChoiceButton';
import { eventDomainTheme } from './eventDomainDisplay';
import { eventHasInsuranceClaimChoice } from './eventDisplay';

/**
 * Карточка события L3 ★: полоса домена, заголовок (+ × в оверлее), лейблы, пузырь, flat-выборы.
 */
export function EventCard({
  event,
  busyId,
  onPick,
  onClose,
  titleId = 'mqx-event-card-title',
}) {
  const disabled = busyId !== null;
  const choices = event?.choices || [];
  const insuranceEvent = eventHasInsuranceClaimChoice(event);
  const recommended = event?.recommended === true;
  const recommendedForNeed = asSafeReactText(event?.recommended_for_need, '');
  const description = asSafeReactText(event.description);
  const domain = eventDomainTheme(event);

  return (
    <article
      className={[
        'mqx-events-card',
        'mqx-events-card--l3',
        domain.modifierClass,
        insuranceEvent && 'mqx-events-card--insurance',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mqx-events-card__band" aria-hidden />
      <div className="mqx-events-card__frame">
        <div className="mqx-events-card__head">
          <h3 id={titleId} className="mqx-events-card__title mqx-events-card__title--l3">
            {asSafeReactText(event.title)}
          </h3>
          {onClose ? (
            <button
              type="button"
              className="mqx-events-card__close"
              aria-label="Закрыть"
              title="Закрыть"
              onClick={onClose}
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="mqx-events-card__labels">
          <span className="mqx-events-domain-pill">
            <span className="mqx-events-domain-pill__dot" aria-hidden />
            {domain.label}
          </span>
          {recommended ? (
            <span
              className="mqx-events-card__badge mqx-events-card__badge--inline mqx-events-card__badge--recommended"
              title={asSafeReactText(event?.recommended_hint, 'Рекомендуемое событие')}
            >
              Рекомендуемое
              {recommendedForNeed ? ` · ${recommendedForNeed}` : ''}
            </span>
          ) : null}
          {insuranceEvent ? (
            <span className="mqx-events-card__badge mqx-events-card__badge--inline">Страховой случай</span>
          ) : null}
        </div>

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
      </div>
    </article>
  );
}
