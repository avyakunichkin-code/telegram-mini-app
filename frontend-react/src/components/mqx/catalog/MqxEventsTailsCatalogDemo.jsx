import { EventCard } from '../events/EventCard';

const LONG_INSURANCE_EVENT = {
  id: 9001,
  event_domain: 'auto',
  title: 'ДТП на перекрёстке с повреждением бампера и фары',
  description:
    'Небольшое столкновение на мокрой дороге. При действующем полисе ОСАГО страховая компания покроет ремонт в пределах лимита. ' +
    'Если оформить случай по полису, не придётся платить крупную сумму из кошелька сразу. Важно успеть подать документы в срок.',
  choices: [
    {
      id: 1,
      title: 'Оформить по полису ОСАГО и получить выплату на ремонт',
      description: 'Страховая возьмёт расходы на себя в рамках лимита полиса',
      insurance_claim: true,
      impacts: [{ kind: 'insurance_payout', delta: 45000 }],
    },
    {
      id: 2,
      title: 'Оплатить из своих',
      description: 'Списание с баланса',
      impacts: [{ kind: 'cash', delta: -45000 }],
    },
  ],
};

const LONG_CONSUMPTION_EVENT = {
  id: 9002,
  event_domain: 'consumption',
  title: 'Кофе каждый день у офиса — привычка съедает бюджет',
  description:
    'Коллеги зовут в кофейню по пути на работу. Чашка 250–350 ₽ каждый будний день — за месяц набегает заметная сумма. ' +
    'Можно взять абонемент со скидкой или заваривать кофе дома и брать с собой в термосе.',
  choices: [
    { id: 3, title: 'Взять абонемент на месяц (−4 500 ₽/мес)' },
    {
      id: 4,
      title: 'Пока без абонемента — плачу по чашке каждый день',
      description: 'Риск перерасхода на мелочи в течение периода',
    },
  ],
};

/** E2 + E5 в #/dev/mqx */
export function MqxEventsTailsCatalogDemo() {
  return (
    <div className="mqx-catalog-events-tails">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        ★ <code>design-lab/events/tails-round/</code> — E2-B halo, E5-B clamp/scroll.
      </p>
      <div className="mqx-stack" style={{ gap: 16, maxWidth: 420 }}>
        <EventCard event={LONG_INSURANCE_EVENT} busyId={null} onPick={() => {}} />
        <EventCard event={LONG_CONSUMPTION_EVENT} busyId={null} onPick={() => {}} />
      </div>
    </div>
  );
}
