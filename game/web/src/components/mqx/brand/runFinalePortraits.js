import studentCupWebp from '../../../assets/run-finale-cup/student-mascot-cup-dash.webp';
import studentCupPng from '../../../assets/run-finale-cup/student-mascot-cup-dash.png';
import professionalCupWebp from '../../../assets/run-finale-cup/professional-mascot-cup-dash.webp';
import professionalCupPng from '../../../assets/run-finale-cup/professional-mascot-cup-dash.png';
import managerCupWebp from '../../../assets/run-finale-cup/manager-mascot-cup-dash.webp';
import managerCupPng from '../../../assets/run-finale-cup/manager-mascot-cup-dash.png';
import entrepreneurCupWebp from '../../../assets/run-finale-cup/entrepreneur-mascot-cup-dash.webp';
import entrepreneurCupPng from '../../../assets/run-finale-cup/entrepreneur-mascot-cup-dash.png';

const BY_SLUG = {
  student: { webp: studentCupWebp, png: studentCupPng },
  professional: { webp: professionalCupWebp, png: professionalCupPng },
  manager: { webp: managerCupWebp, png: managerCupPng },
  entrepreneur: { webp: entrepreneurCupWebp, png: entrepreneurCupPng },
};

export function getRunFinaleCupPortrait(personaSlug) {
  return BY_SLUG[personaSlug] || BY_SLUG.student;
}
