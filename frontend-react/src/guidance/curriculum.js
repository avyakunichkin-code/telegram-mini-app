/** Канон curriculum O3 spine — зеркало backend/app/guidance/curriculum.py */

export const STUDENT_TEMPLATE_KEY = 'mq_game_basic_v1';

/** События и онбординг t_events_intro — с этого хода (зеркало game/rules.py). */
export const MIN_PERIOD_INDEX_FOR_GAME_EVENTS = 3;

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
      'Вот что **произошло за этот ход** — сравни с тем, что было на главной игровой странице до **«Завершить ход»**.\n\n**Нажми «Понятно»** — начнётся следующий ход.',
  },
  {
    id: 'p2_new_month',
    period_index: 2,
    module_step: 1,
    module_step_count: 1,
    gate: 'read',
    title: 'Новый ход — новый цикл',
    body:
      '**Ход №2**! **«Зарплата»** снова активна — забери, пока не завершил ход. Помни: после **«Завершить ход»** зарплата за этот ход уже **не повторится**.\n\nКарточки событий подключатся с **хода №3** — пока просто освой ритм.\n\n**Нажми «Понятно»**.',
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

/** Spine P1+P2 завершён (completed_beats — spine; у trigger payload туда же пишутся completed_triggers). */
export function isSpineGuidanceComplete(guidance) {
  if (!guidance?.show_curriculum) return true;
  const completed = guidance?.completed_beats || [];
  return completed.includes('p1_close') && completed.includes('p2_new_month');
}

/** Шаг t_events_intro пройден (выбор события, dismiss или skip_all). */
export function isEventsIntroGuidanceComplete(guidance) {
  if (!guidance?.show_curriculum) return true;
  return (guidance?.completed_beats || []).includes('t_events_intro');
}

/**
 * Не автопоказывать карусель событий, пока curriculum ждёт intro на ходе 3+.
 * Ручное открытие «События» на шаге t_events_intro по-прежнему разрешено.
 */
export function shouldDeferEventsAutoOpen(guidance, periodIndex) {
  const pi = Number(periodIndex);
  if (!Number.isFinite(pi) || pi < MIN_PERIOD_INDEX_FOR_GAME_EVENTS) return false;
  if (!guidance?.show_curriculum) return false;
  return !isEventsIntroGuidanceComplete(guidance);
}

/**
 * События — с хода MIN_PERIOD_INDEX_FOR_GAME_EVENTS; t_events_intro — после spine P1+P2.
 */
export function areGameEventsUnlocked(guidance, onboardingState, periodIndex = null) {
  const pi = Number(periodIndex);
  const pastEventGate = Number.isFinite(pi) && pi >= MIN_PERIOD_INDEX_FOR_GAME_EVENTS;

  if (onboardingState === 'brief_done') return true;
  if (!guidance?.show_curriculum) {
    return !Number.isFinite(pi) || pastEventGate;
  }
  if (guidance?.beat_id === 'p1_close' && guidance?.show_debrief) return false;
  if (!pastEventGate) return false;
  if (isP1GuidanceComplete(guidance)) return true;
  const beatId = guidance?.beat_id;
  if (beatId && beatId.startsWith('t_')) return true;
  return false;
}

export function shouldDeferPeriodCloseDuringGuidance(guidance, periodIndex) {
  if (!guidance?.show_curriculum) return false;
  if (isP1GuidanceComplete(guidance)) return false;
  return Number(periodIndex) <= 1;
}

export function shouldDeferGuidanceForPeriodCloseRitual(periodCloseOpen, guidance = null) {
  if (!periodCloseOpen) return false;
  if (guidance?.beat_id === 'p1_close' && guidance?.show_debrief) return false;
  return true;
}

/** Блокирует автопоказ карусели событий, пока идёт ритуал итогов, debrief P1 или intro событий. */
export function shouldBlockAutoEventsOverlay({
  periodCloseOpen,
  periodCloseSummary,
  queuedPeriodClose,
  guidance,
  periodIndex = null,
}) {
  if (periodCloseOpen) return true;
  if (periodCloseSummary) return true;
  if (queuedPeriodClose) return true;
  if (guidance?.beat_id === 'p1_close' && guidance?.show_debrief) return true;
  if (shouldDeferEventsAutoOpen(guidance, periodIndex)) return true;
  return false;
}
