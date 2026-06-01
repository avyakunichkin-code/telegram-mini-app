export function choiceHasInsuranceClaim(choice) {
  return !!choice?.insurance_claim;
}

export function eventHasInsuranceClaimChoice(event) {
  return (event?.choices || []).some(choiceHasInsuranceClaim);
}
