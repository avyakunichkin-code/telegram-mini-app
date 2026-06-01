/**
 * Портреты персонажей (design-lab/game-templates/persona-portraits-round).
 * Размеры: pick (56h) — выбор сценария; dash (108h) — Z-NEEDS; md (72h) — запас.
 */
import entrepreneurDashPng from '../../../assets/character-portraits/entrepreneur-mascot-dash.png';
import entrepreneurDashWebp from '../../../assets/character-portraits/entrepreneur-mascot-dash.webp';
import entrepreneurPickPng from '../../../assets/character-portraits/entrepreneur-mascot-pick.png';
import entrepreneurPickWebp from '../../../assets/character-portraits/entrepreneur-mascot-pick.webp';
import managerDashPng from '../../../assets/character-portraits/manager-mascot-dash.png';
import managerDashWebp from '../../../assets/character-portraits/manager-mascot-dash.webp';
import managerPickPng from '../../../assets/character-portraits/manager-mascot-pick.png';
import managerPickWebp from '../../../assets/character-portraits/manager-mascot-pick.webp';
import professionalDashPng from '../../../assets/character-portraits/professional-mascot-dash.png';
import professionalDashWebp from '../../../assets/character-portraits/professional-mascot-dash.webp';
import professionalPickPng from '../../../assets/character-portraits/professional-mascot-pick.png';
import professionalPickWebp from '../../../assets/character-portraits/professional-mascot-pick.webp';
import studentDashPng from '../../../assets/character-portraits/student-mascot-dash.png';
import studentDashWebp from '../../../assets/character-portraits/student-mascot-dash.webp';
import studentPickPng from '../../../assets/character-portraits/student-mascot-pick.png';
import studentPickWebp from '../../../assets/character-portraits/student-mascot-pick.webp';

const BY_SLUG = {
  student: {
    pick: { png: studentPickPng, webp: studentPickWebp, height: 56 },
    dash: { png: studentDashPng, webp: studentDashWebp, height: 108 },
  },
  professional: {
    pick: { png: professionalPickPng, webp: professionalPickWebp, height: 56 },
    dash: { png: professionalDashPng, webp: professionalDashWebp, height: 108 },
  },
  manager: {
    pick: { png: managerPickPng, webp: managerPickWebp, height: 56 },
    dash: { png: managerDashPng, webp: managerDashWebp, height: 108 },
  },
  entrepreneur: {
    pick: { png: entrepreneurPickPng, webp: entrepreneurPickWebp, height: 56 },
    dash: { png: entrepreneurDashPng, webp: entrepreneurDashWebp, height: 108 },
  },
};

/** template_key → slug персонажа */
export const TEMPLATE_KEY_TO_PERSONA_SLUG = {
  mq_game_basic_v1: 'student',
  mq_game_tight_budget_v1: 'professional',
  mq_game_mortgage_stress_v1: 'manager',
  mq_game_debt_stack_v1: 'entrepreneur',
};

export function getPersonaPortrait(templateKey, size = 'pick') {
  const slug = TEMPLATE_KEY_TO_PERSONA_SLUG[templateKey];
  if (!slug) return null;
  const pack = BY_SLUG[slug]?.[size];
  if (!pack) return null;
  return { slug, ...pack };
}
