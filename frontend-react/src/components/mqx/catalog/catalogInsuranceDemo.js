import { INSURANCE_PLANS } from '../../../constants/insuranceProducts';

/** Демо-полис для #/dev/mqx (страховки). */
export const CATALOG_INSURANCE_POLICY = {
  id: 1,
  kind: 'auto_liability',
  product: 'auto',
  title: 'ОСАГО — Стандарт',
  monthly_premium: 2400,
  payout_amount: 400000,
  term_periods: 12,
  started_period_index: 3,
  expires_period_index: 15,
};

/** План из prod-каталога для витрины карточек. */
export function catalogInsurancePlan() {
  return INSURANCE_PLANS.find((p) => p.plan_key === 'auto_liability_standard') ?? INSURANCE_PLANS[0];
}
