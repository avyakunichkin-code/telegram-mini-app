/**
 * Фикстуры финала ★ BG-2 для #/dev/mqx — форма payload `run_finale` (game/api/app/game/run_finale.py).
 * Тексты поражения — как отдаёт API (DEFEAT_FACT_COPY), не придуманные.
 */
export const CATALOG_RUN_FINALE_DECISIONS = [
  { kind: 'debt_overpaid', direction: 'cost', title: 'Кредит «Авто»', detail: 'Заплачено сверх взятой суммы за 28 ходов', amount: 340000 },
  { kind: 'salary_missed', direction: 'cost', title: 'Пропущенные зарплаты', detail: 'Не получено за 3 хода', amount: 150000, is_estimate: true },
  { kind: 'investment_gain', direction: 'gain', title: 'Вклады и облигации', detail: 'Заработано на вложениях за партию', amount: 86000 },
];

export const CATALOG_RUN_FINALE_WIN = {
  outcome: 'victory',
  period_index: 39,
  turns_completed: 38,
  template_key: 'mq_game_basic_v1',
  persona_slug: 'student',
  scenario_title: 'Ты вывел студенческий бюджет в плюс',
  scenario_line: 'Сценарий «Студент» — ты закрыл цепочку целей.',
  cash_balance: 412000,
  cushion_turns: 6.1,
  can_dismiss: true,
  monthly_burn: 42000,
  decisions: CATALOG_RUN_FINALE_DECISIONS,
};

export const CATALOG_RUN_FINALE_DEFEAT_CASH = {
  outcome: 'defeat',
  period_index: 12,
  template_key: 'mq_game_basic_v1',
  persona_slug: 'student',
  scenario_title: 'Бюджет не выдержал три месяца',
  defeat_reason: 'cash_negative_streak',
  monthly_burn: 42000,
  decisions: CATALOG_RUN_FINALE_DECISIONS,
  cash_balance: -8200,
  cushion_turns: null,
  fact: {
    title: 'Три хода подряд счёт был в минусе.',
    text: 'После последнего хода на счёте: −8 200 ₽.',
    tips: [
      'Забирай зарплату до «Завершить ход» — без кнопки её не будет.',
      'Держи подушку хотя бы на 2 хода расходов.',
    ],
  },
};

export const CATALOG_RUN_FINALE_DEFEAT_NEEDS = {
  outcome: 'defeat',
  period_index: 9,
  template_key: 'mq_game_tight_budget_v1',
  persona_slug: 'professional',
  scenario_title: 'Расходы перебили доход',
  defeat_reason: 'needs_depletion',
  monthly_burn: 42000,
  decisions: CATALOG_RUN_FINALE_DECISIONS,
  cash_balance: 23500,
  cushion_turns: 0.8,
  fact: {
    title: 'Три хода подряд одна из потребностей была на нуле.',
    text: 'Деньги — не единственный ресурс. На счёте в конце: 23 500 ₽.',
    tips: [
      'В событиях выбирай варианты, которые поднимают потребности.',
      'Если шкала у нуля — нажми «Улучшить» на главной.',
    ],
  },
};
