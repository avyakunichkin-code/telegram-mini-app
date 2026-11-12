/** L3 baseline (короткое ДТП) для #/dev/mqx — блок «События ★ L3». */
export const CATALOG_EVENTS_L3_BASELINE = {
  id: 1,
  event_domain: 'auto',
  title: 'ДТП',
  description: 'Небольшое столкновение. При ОСАГО страховая покроет ущерб.',
  choices: [
    {
      id: 10,
      title: 'Оформить по полису ОСАГО',
      description: 'Выплата по страховке',
      insurance_claim: true,
      impacts: [{ kind: 'insurance_payout', delta: 45000 }],
    },
    {
      id: 11,
      title: 'Оплатить из своих',
      impacts: [{ kind: 'cash', delta: -45000 }],
    },
    { id: 12, title: 'Договориться без оформления' },
  ],
};
