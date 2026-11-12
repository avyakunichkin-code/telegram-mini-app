/** template_key → роль игрока в UI (карта хода). Зеркало seeds game_starter_templates. */
export const TEMPLATE_KEY_TO_ROLE_TITLE = {
  mq_game_basic_v1: 'Студент',
  mq_game_tight_budget_v1: 'Профессионал',
  mq_game_mortgage_stress_v1: 'Руководитель',
  mq_game_debt_stack_v1: 'Предприниматель',
};

export function personaRoleTitle(templateKey) {
  return TEMPLATE_KEY_TO_ROLE_TITLE[templateKey] ?? 'Игрок';
}
