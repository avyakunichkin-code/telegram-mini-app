/** Канон шагов guided onboarding — см. design-lab/onboarding-guided/CONTENT.md */

/** Пауза между шагами 1 и 3 — без UI-таймера для игрока (см. OnboardingCoachOverlay). */
export const ONBOARDING_PRACTICE_MS = 10_000;

export const ONBOARDING_STEPS = [
  {
    id: 'period_timer',
    title: 'Привет, я Монетка',
    body:
      'Игра идёт периодами — как месяцы. Слева номер периода, сверху таймер (⏸ / ▶).\n\nПлан на старт: Зарплата → В подушку → Следующий период. Можешь потыкать таймер — дальше по шагам.',
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
    id: 'safety_fund',
    title: 'Фин.подушка',
    body:
      '«Пополнить» подушку — запас на чёрный день. Есть лишнее на счёте — закинь хоть немного. Я подожду, пока нажмёшь.',
    anchor: 'cushion',
    gate: 'action',
    actionKey: 'cushion',
  },
  {
    id: 'next_period',
    title: 'Закрыть месяц',
    body:
      'Когда готов закрыть месяц — «Следующий период». Таймер можно не дожидаться. Найди кнопку в шапке — потом играй сам.',
    anchor: 'next_period',
    gate: 'practice',
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
