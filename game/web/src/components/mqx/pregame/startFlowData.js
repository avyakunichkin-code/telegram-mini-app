import student from '../../../assets/character-portraits/student-portrait-concept.png';
import specialist from '../../../assets/character-portraits/professional-portrait-concept-v3.png';
import manager from '../../../assets/character-portraits/manager-portrait-concept.png';
import entrepreneur from '../../../assets/character-portraits/entrepreneur-portrait-concept-v3.png';

export const roles = [
  { templateKey: 'mq_game_basic_v1', id: 'student', name: 'Студент', label: 'студента', portrait: student },
  { templateKey: 'mq_game_tight_budget_v1', id: 'specialist', name: 'Специалист', label: 'специалиста', portrait: specialist },
  { templateKey: 'mq_game_mortgage_stress_v1', id: 'manager', name: 'Руководитель', label: 'руководителя', portrait: manager },
  { templateKey: 'mq_game_debt_stack_v1', id: 'entrepreneur', name: 'Предприниматель', label: 'предпринимателя', portrait: entrepreneur },
];

export const screens = {
  welcome: 'Гостевой вход', login: 'Вход', register: 'Регистрация',
  empty: 'Без сохранений', saved: 'С сохранением', saves: 'Все сохранения',
  roles: 'Выбор роли', intro: 'Напарник', returning: 'Вернувшийся гость',
};
