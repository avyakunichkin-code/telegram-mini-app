/** Канон шагов guided onboarding — см. design-lab/onboarding-guided/CONTENT.md */

export const ONBOARDING_PRACTICE_MS = 6_000;

export const ONBOARDING_STEPS = [
  {
    id: 'period_timer',
    title: 'Привет, я Монетка',
    body:
      'Игра идёт периодами — как месяцы. Слева номер периода, сверху таймер (⏸ / ▶).\n\nПлан на старт: Зарплата → В подушку → Следующий период. Сейчас 6 секунд потыкай таймер — дальше по шагам.',
    anchor: 'hero',
    gate: 'practice',
  },
  {
    id: 'salary',
    title: 'Зарплата не сама',
    body:
      'Зарплату забираешь сам — кнопка «Зарплата». Не нажал до конца месяца — за период не повторится. Жми «Зарплата» сейчас. Таймер до нуля ждать не нужно.',
    anchor: 'salary',
    gate: 'action',
    actionKey: 'salary',
  },
  {
    id: 'next_period',
    title: 'Закрыть месяц',
    body:
      'Когда готов закрыть месяц — «Следующий период». Таймер можно не дожидаться. Найди кнопку (6 с на ознакомление) — дальше подскажу про подушку.',
    anchor: 'next_period',
    gate: 'practice',
  },
  {
    id: 'safety_fund',
    title: 'Фин.подушка',
    body:
      '«В подушку» — запас на чёрный день. Есть лишнее на счёте — закинь хоть немного. Я подожду, пока нажмёшь.',
    anchor: 'cushion',
    gate: 'action',
    actionKey: 'cushion',
  },
  {
    id: 'farewell',
    title: 'Удачи в квесте',
    body:
      'Ну всё, я побежала к своим целям — вперёд, начинай игру. Ошибаться можно, главное — смотреть, почему сдвинулись цифры. Увидимся на дашборде.',
    anchor: null,
    gate: 'finish',
  },
];

export function getOnboardingStep(index) {
  return ONBOARDING_STEPS[index] ?? null;
}
