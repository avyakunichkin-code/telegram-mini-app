import { asSafeReactText } from '../../../utils/displayText';

export function choiceHasInsuranceClaim(choice) {
  return !!choice?.insurance_claim;
}

export function eventHasInsuranceClaimChoice(event) {
  return (event?.choices || []).some(choiceHasInsuranceClaim);
}

/** E5-B: пузырь со скроллом, если описание длиннее порога. */
export const EVENT_BUBBLE_SCROLL_MIN_LEN = 140;

export function eventDescriptionNeedsScroll(description) {
  return String(asSafeReactText(description, '')).length > EVENT_BUBBLE_SCROLL_MIN_LEN;
}

/** @deprecated E5-B — предпочитайте CSS line-clamp в `events.css`. */
export function truncateEventText(raw, len) {
  const s = String(asSafeReactText(raw, ''));
  if (!s) return '';
  return s.length <= len ? s : `${s.slice(0, len - 1)}…`;
}
