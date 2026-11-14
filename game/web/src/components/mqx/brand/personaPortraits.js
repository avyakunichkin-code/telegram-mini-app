import student from '../../../assets/character-portraits/student-introduce.webp';
import professional from '../../../assets/character-portraits/professional-explain.webp';
import manager from '../../../assets/character-portraits/manager-choice.webp';
import entrepreneur from '../../../assets/character-portraits/entrepreneur-roadmap.webp';

const BY_SLUG = { student, professional, manager, entrepreneur };
const HEIGHT_BY_SIZE = { pick: 56, dash: 108 };

/** template_key → slug персонажа */
export const TEMPLATE_KEY_TO_PERSONA_SLUG = {
  mq_game_basic_v1: 'student',
  mq_game_tight_budget_v1: 'professional',
  mq_game_mortgage_stress_v1: 'manager',
  mq_game_debt_stack_v1: 'entrepreneur',
};

export function getPersonaPortrait(templateKey, size = 'pick') {
  const slug = TEMPLATE_KEY_TO_PERSONA_SLUG[templateKey];
  const webp = BY_SLUG[slug];
  const height = HEIGHT_BY_SIZE[size];
  if (!webp || !height) return null;
  return { slug, webp, height };
}
