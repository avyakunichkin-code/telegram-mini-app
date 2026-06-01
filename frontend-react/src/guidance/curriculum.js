/** Канон curriculum O2 — зеркало backend/app/guidance/curriculum.py */

export const STUDENT_TEMPLATE_KEY = 'mq_game_basic_v1';

export const CURRICULUM = [
  {
    id: 'p1_period',
    period_index: 1,
    module_step: 1,
    module_step_count: 4,
    gate: 'read',
    title: 'Привет!',
    body:
      'Игра идёт **периодами** — как месяцы. Слева «Месяц открыт», справа — **«Закрыть месяц»**, когда закончишь дела.\n\nПлан на старт: **Зарплата** → **В подушку** → **Закрыть месяц**.',
  },
  {
    id: 'p1_salary',
    period_index: 1,
    module_step: 2,
    module_step_count: 4,
    gate: 'action_salary',
    title: 'Зарплата не сама',
    body:
      'Зарплату забираешь **сам** — кнопкой **«Зарплата»**. Не нажал до конца месяца — за период не повторится.',
  },
  {
    id: 'p1_cushion',
    period_index: 1,
    module_step: 3,
    module_step_count: 4,
    gate: 'action_cushion',
    title: 'Фин.подушка',
    body: '**«Пополнить»** подушку — запас на чёрный день. Закинь хоть немного, если есть лишнее на счёте.',
  },
  {
    id: 'p1_close',
    period_index: 1,
    module_step: 4,
    module_step_count: 4,
    gate: 'action_close',
    title: 'Закрыть месяц',
    body:
      'В **конце месяца** автоматически спишутся расходы на жизнь, обязательства и содержание — даже если в течение месяца баланс был в плюсе.\n\nКогда готов — жми **«Закрыть месяц»** в шапке.',
    debrief_body:
      'Вот что списалось в этом ходе. Смотри на цифры после закрытия — так проще понять, куда ушли деньги.',
  },
  {
    id: 'p2_events_intro',
    period_index: 2,
    module_step: 1,
    module_step_count: 2,
    gate: 'action_event',
    title: 'Жизненные ситуации',
    body:
      'Карточки событий — это **решения**: нажимай кнопки с суммами и последствиями, а не только листай.',
  },
  {
    id: 'p2_events_done',
    period_index: 2,
    module_step: 2,
    module_step_count: 2,
    gate: 'read',
    title: 'Отлично',
    body: 'Ты принял решение в ситуации — так и задумано. Дальше играй сам.',
  },
  {
    id: 'p3_needs',
    period_index: 3,
    module_step: 1,
    module_step_count: 2,
    gate: 'read',
    title: 'Характеристики',
    body:
      'Четыре шкалы — баланс жизни: комфорт, статус, общение, здоровье. Кнопка **?** подскажет подробнее; **«Побаловать себя»** — мягкий способ поднять шкалу.',
  },
  {
    id: 'p3_farewell',
    period_index: 3,
    module_step: 2,
    module_step_count: 2,
    gate: 'farewell',
    title: 'Удачи в квесте',
    body:
      'Ну всё, я побежала к своим целям — **вперёд, начинай игру**. Ошибаться можно, главное — смотреть, *почему* сдвинулись цифры.',
  },
];

export function isP1GuidanceComplete(guidance) {
  if (!guidance) return true;
  if (!guidance.show_curriculum) return true;
  return (guidance.completed_beats || []).includes('p1_close');
}
