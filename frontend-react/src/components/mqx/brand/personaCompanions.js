import studentPng from '../../../assets/companions/student.png';
import studentWebp from '../../../assets/companions/student.webp';
import professionalPng from '../../../assets/companions/professional.png';
import professionalWebp from '../../../assets/companions/professional.webp';
import managerPng from '../../../assets/companions/manager.png';
import managerWebp from '../../../assets/companions/manager.webp';
import entrepreneurPng from '../../../assets/companions/entrepreneur.png';
import entrepreneurWebp from '../../../assets/companions/entrepreneur.webp';
import { TEMPLATE_KEY_TO_PERSONA_SLUG } from './personaPortraits';

const BY_SLUG = {
  student: { png: studentPng, webp: studentWebp, label: 'Студбилет' },
  professional: { png: professionalPng, webp: professionalWebp, label: 'Зарплатная карта' },
  manager: { png: managerPng, webp: managerWebp, label: 'Портфель' },
  entrepreneur: { png: entrepreneurPng, webp: entrepreneurWebp, label: 'Смартфон' },
};
const HEIGHTS = { pick: 56, md: 72, dash: 108 };

export function getPersonaCompanion(templateKey, size = 'md') {
  const slug = TEMPLATE_KEY_TO_PERSONA_SLUG[templateKey];
  const art = BY_SLUG[slug];
  const height = HEIGHTS[size];
  return art && Number.isFinite(height) ? { slug, ...art, height } : null;
}
