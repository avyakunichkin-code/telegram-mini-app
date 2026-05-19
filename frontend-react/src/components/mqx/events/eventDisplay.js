import { asSafeReactText } from '../../../utils/displayText';

export function choiceHasInsuranceClaim(choice) {
  return !!choice?.insurance_claim;
}

export function eventHasInsuranceClaimChoice(event) {
  return (event?.choices || []).some(choiceHasInsuranceClaim);
}

export function truncateEventText(raw, len) {
  const s = String(asSafeReactText(raw, ''));
  if (!s) return '';
  return s.length <= len ? s : `${s.slice(0, len - 1)}…`;
}
