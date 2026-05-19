/** Канон шагов guided onboarding — см. design-lab/onboarding-guided/CONTENT.md */

export const ONBOARDING_PRACTICE_MS = 10_000;

export const ONBOARDING_STEPS = [
  {
    id: 'period_timer',
    title: 'Привет, я Монетка',
    body:
      'Оказывается, игра идёт периодами — как месяцы. Вот таймер: можно ⏸ паузу или ▶ продолжить. Номер периода — слева. Сейчас подсказка спрячется на 10 секунд — потыкай сам. Потом расскажу про деньги.',
    anchor: 'hero',
    gate: 'practice',
  },
  {
    id: 'salary',
    title: 'Зарплата не сама',
    body:
      'Я только что поняла: зарплату ты забираешь сам — кнопкой «Зарплата». Не нажал до конца месяца? Всё, плакали твои денежки — теперь думай, как прожить без них. Жми «Зарплата» — проверим на практике. Ждать таймер до нуля не нужно.',
    anchor: 'salary',
    gate: 'action',
    actionKey: 'salary',
  },
  {
    id: 'next_period',
    title: 'Закрыть месяц',
    body:
      'Когда месяц отыграл — жми «Следующий период». Не обязательно ждать, пока таймер дойдёт до нуля. Сейчас просто найди кнопку — в игру перейдёшь сам, когда будешь готов.',
    anchor: 'next_period',
    gate: 'practice',
  },
  {
    id: 'safety_fund',
    title: 'Подушка',
    body:
      'Ещё штука: «В подушку» — запас на чёрный день. Когда есть лишнее на счёте — закинь. Попробуй хоть немного — я подожду.',
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
