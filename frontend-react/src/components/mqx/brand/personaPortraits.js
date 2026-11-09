/**
 * ★ B «Мягкий объём» (design-lab/mascots/APPROVED.md).
 * Дисплей: pick 56, md 72, dash 108, avatar 40; файлы UI — 2x.
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
import studentMdPng from '../../../assets/character-portraits/student-mascot-md.png';
import studentMdWebp from '../../../assets/character-portraits/student-mascot-md.webp';
import studentAvatarPng from '../../../assets/character-portraits/student-mascot-avatar.png';
import studentAvatarWebp from '../../../assets/character-portraits/student-mascot-avatar.webp';
import professionalMdPng from '../../../assets/character-portraits/professional-mascot-md.png';
import professionalMdWebp from '../../../assets/character-portraits/professional-mascot-md.webp';
import professionalAvatarPng from '../../../assets/character-portraits/professional-mascot-avatar.png';
import professionalAvatarWebp from '../../../assets/character-portraits/professional-mascot-avatar.webp';
import managerMdPng from '../../../assets/character-portraits/manager-mascot-md.png';
import managerMdWebp from '../../../assets/character-portraits/manager-mascot-md.webp';
import managerAvatarPng from '../../../assets/character-portraits/manager-mascot-avatar.png';
import managerAvatarWebp from '../../../assets/character-portraits/manager-mascot-avatar.webp';
import entrepreneurMdPng from '../../../assets/character-portraits/entrepreneur-mascot-md.png';
import entrepreneurMdWebp from '../../../assets/character-portraits/entrepreneur-mascot-md.webp';
import entrepreneurAvatarPng from '../../../assets/character-portraits/entrepreneur-mascot-avatar.png';
import entrepreneurAvatarWebp from '../../../assets/character-portraits/entrepreneur-mascot-avatar.webp';

const BY_SLUG = {
  student: {
    pick: { png: studentPickPng, webp: studentPickWebp, height: 56 },
    dash: { png: studentDashPng, webp: studentDashWebp, height: 108 },
    md: { png: studentMdPng, webp: studentMdWebp, height: 72 },
    avatar: { png: studentAvatarPng, webp: studentAvatarWebp, height: 40 },
  },
  professional: {
    pick: { png: professionalPickPng, webp: professionalPickWebp, height: 56 },
    dash: { png: professionalDashPng, webp: professionalDashWebp, height: 108 },
    md: { png: professionalMdPng, webp: professionalMdWebp, height: 72 },
    avatar: { png: professionalAvatarPng, webp: professionalAvatarWebp, height: 40 },
  },
  manager: {
    pick: { png: managerPickPng, webp: managerPickWebp, height: 56 },
    dash: { png: managerDashPng, webp: managerDashWebp, height: 108 },
    md: { png: managerMdPng, webp: managerMdWebp, height: 72 },
    avatar: { png: managerAvatarPng, webp: managerAvatarWebp, height: 40 },
  },
  entrepreneur: {
    pick: { png: entrepreneurPickPng, webp: entrepreneurPickWebp, height: 56 },
    dash: { png: entrepreneurDashPng, webp: entrepreneurDashWebp, height: 108 },
    md: { png: entrepreneurMdPng, webp: entrepreneurMdWebp, height: 72 },
    avatar: { png: entrepreneurAvatarPng, webp: entrepreneurAvatarWebp, height: 40 },
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
  if (!pack?.png || !pack?.webp) return null;
  return { slug, ...pack };
}
