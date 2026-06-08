/** Канон curriculum O3 spine — зеркало backend/app/guidance/curriculum.py */

export const STUDENT_TEMPLATE_KEY = 'mq_game_basic_v1';

/** O3 contextual triggers — зеркало backend/app/guidance/triggers.py */
export const GUIDANCE_SCREEN_TRIGGERS = {
  'finance:actions': 't_finance_actions',
  'finance:details': 't_finance_details',
  needs: 't_needs',
};

export const CURRICULUM = [
  {
    id: 'p1_period',
    period_index: 1,
    module_step: 1,
    module_step_count: 5,
    gate: 'read',
    title: 'Эй, это твой ход',
    body:
      'Игра идёт **ходами** — один ход это цикл «решения → списания → новый ход». Слева **«Ход в процессе»**, справа будет **«Завершить ход»**.\n\nСейчас просто осмотрись — цифры на экране **твои**, не чужие.\n\n**Нажми «Понятно»**, когда готов двигаться дальше.',
  },
  {
    id: 'p1_flows',
    period_index: 1,
    module_step: 2,
    module_step_count: 5,
    gate: 'read',
    title: 'Откуда деньги и куда утекают',
    body:
      'Я только что поняла, как тут устроено: **Доходы** — сколько приходит за ход (зарплата ~**62 500 ₽**), **Расходы** — сколько **спишется в конце** хода (жизнь ~**37 500 ₽**). Пока они на экране — это **план**, не мгновенный удар по счёту.\n\nСерые кнопки внизу — значит, **ещё рано**; я подскажу, когда нажимать.\n\n**Нажми «Понятно»**.',
  },
  {
    id: 'p1_salary',
    period_index: 1,
    module_step: 3,
    module_step_count: 5,
    gate: 'action_salary',
    title: 'Зарплата не приходит сама',
    body:
      'Ещё одна штука: зарплату забираешь **ты** — кнопкой **«Зарплата»** внизу. Я тоже забываю, честно. Не успел до **«Завершить ход»** — за этот ход не повторится.\n\n**Сейчас: нажми «Зарплата»** в блоке действий.',
  },
  {
    id: 'p1_cushion',
    period_index: 1,
    module_step: 4,
    module_step_count: 5,
    gate: 'action_cushion',
    title: 'Запас на чёрный день',
    body:
      '**«Пополнить»** — это **подушка**: не траты, а копилка на форс-мажор. Хоть немного, если на счёте есть свободное — привыкнешь откладывать.\n\n**Сейчас: нажми «Пополнить»** (подушку).',
  },
  {
    id: 'p1_close',
    period_index: 1,
    module_step: 5,
    module_step_count: 5,
    gate: 'action_close',
    title: 'Завершаем ход',
    body:
      'Интересно, а что если не завершить? Расходы всё равно **спишутся**, когда нажмёшь **«Завершить ход»** в шапке — жизнь, обязательства, содержание. Даже если баланс в течение хода был в плюсе.\n\n**Сейчас: нажми «Завершить ход»**, когда будешь готов.',
    debrief_body:
      'Вот что **реально списалось** в этом ходе — сравни с тем, что видел на чипе «Расходы» до завершения. Так проще понять, куда ушли деньги.\n\n**Нажми «Понятно»** — откроется следующий ход.',
  },
  {
    id: 'p2_new_month',
    period_index: 2,
    module_step: 1,
    module_step_count: 1,
    gate: 'read',
    title: 'Новый ход — новый цикл',
    body:
      '**Ход №2**! **«Зарплата»** снова активна — забери, пока не завершил ход. Помни: после **«Завершить ход»** зарплата за этот ход уже **не повторится**.\n\n**Нажми «Понятно»** — дальше подсказки будут появляться, когда зайдёшь в новые разделы.',
  },
];

export function isP1GuidanceComplete(guidance) {
  if (!guidance) return true;
  if (!guidance.show_curriculum) return true;
  return (guidance.completed_beats || []).includes('p1_close');
}

export function isTriggerBeat(beatId) {
  return typeof beatId === 'string' && beatId.startsWith('t_');
}

/**
 * События — после P1 (закрыт p1_close), на P2+.
 */
export function areGameEventsUnlocked(guidance, onboardingState, periodIndex = null) {
  if (onboardingState === 'brief_done') return true;
  if (!guidance?.show_curriculum) return true;
  if (isP1GuidanceComplete(guidance)) return true;
  if (Number(periodIndex) >= 2) return true;
  const beatId = guidance?.beat_id;
  if (beatId && (beatId.startsWith('p2_') || beatId.startsWith('t_'))) return true;
  return false;
}

export function shouldDeferPeriodCloseDuringGuidance(guidance, periodIndex) {
  if (!guidance?.show_curriculum) return false;
  if (isP1GuidanceComplete(guidance)) return false;
  return Number(periodIndex) <= 1;
}

export function shouldDeferGuidanceForPeriodCloseRitual(periodCloseOpen) {
  return Boolean(periodCloseOpen);
}
