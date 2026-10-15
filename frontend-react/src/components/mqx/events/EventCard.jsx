import { asSafeReactText } from '../../../utils/displayText';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { IconHelpBookWithBadge } from '../icons/MqxContextHelpIcons';
import { EventChoiceButton } from './EventChoiceButton';
import { eventDomainTheme } from './eventDomainDisplay';
import { eventHasInsuranceClaimChoice } from './eventDisplay';

/**
 * Карта события ★ BG-2 (канон L3): полоса домена с пилюлями и ×, заголовок,
 * пузырь Монетки, плоские выборы с чипами последствий.
 */
export function EventCard({
  event,
  busyId,
  onPick,
  onClose,
  onHelp,
  titleId = 'mqx-event-card-title',
}) {
  const disabled = busyId !== null;
  const choices = event?.choices || [];
  const insuranceEvent = eventHasInsuranceClaimChoice(event);
  const recommended = event?.recommended === true;
  const recommendedForNeed = asSafeReactText(event?.recommended_for_need, '');
  const description = asSafeReactText(event.description);
  const titleText = asSafeReactText(event.title);
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
      <div className="mqx-events-card__band">
        <div className="mqx-events-card__labels">
          <span className="mqx-events-domain-pill">{domain.label}</span>
          {insuranceEvent ? (
            <span className="mqx-events-domain-pill mqx-events-domain-pill--insurance">
              <span className="mqx-events-card__badge-pulse" aria-hidden />
              Страховой случай
            </span>
          ) : null}
          {recommended ? (
            <span
              className="mqx-events-domain-pill mqx-events-domain-pill--recommended"
              title={asSafeReactText(event?.recommended_hint, 'Рекомендуемое событие')}
            >
              Рекомендуемое
              {recommendedForNeed ? ` · ${recommendedForNeed}` : ''}
            </span>
          ) : null}
        </div>
        <div className="mqx-events-card__head-actions">
          {onHelp ? (
            <button
              type="button"
              className="mqx-help-icon-btn mqx-help-icon-btn--badge mqx-events-card__help"
              aria-label="Как читать событие"
              title="Как читать событие"
              onClick={onHelp}
            >
              <IconHelpBookWithBadge size={17} />
              <span className="mqx-help-icon-btn__badge" aria-hidden="true">
                ?
              </span>
            </button>
          ) : null}
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
      </div>

      <div className="mqx-events-card__frame">
        <h3 id={titleId} className="mqx-events-card__title mqx-events-card__title--l3" title={titleText}>
          {titleText}
        </h3>

        {description ? (
          <div className="mqx-events-card__bubble-row">
            <MonetkaAvatar size={44} className="mqx-events-card__monetka" />
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
