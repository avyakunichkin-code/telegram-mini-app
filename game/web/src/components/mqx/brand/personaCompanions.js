import { getPersonaPortrait } from './personaPortraits';
import studbilet from '../../../assets/companions/studbilet.svg';
import card from '../../../assets/companions/card.svg';
import briefcase from '../../../assets/companions/briefcase.svg';
import phone from '../../../assets/companions/phone.svg';

/** template_key → пара; строки — из раунда (вариант B «Карточка персонажа»). */
const BY_TEMPLATE = {
  mq_game_basic_v1: {
    name: 'Студент',
    line: 'Чистый старт — без долгов и активов',
    companion: studbilet,
    companionName: 'Студбилет',
  },
  mq_game_tight_budget_v1: {
    name: 'Профессионал',
    line: 'Аренда, авто и автокредит с первого периода',
    companion: card,
    companionName: 'Зарплатная карта',
  },
  mq_game_mortgage_stress_v1: {
    name: 'Руководитель',
    line: 'Своё жильё, ипотека и два автомобиля',
    companion: briefcase,
    companionName: 'Портфель',
  },
  mq_game_debt_stack_v1: {
    name: 'Предприниматель',
    line: 'Ипотека, два авто и кредитная карта',
    companion: phone,
    companionName: 'Смартфон',
  },
};

/** @returns пара для экрана знакомства; неизвестный шаблон — Студент (как авто-старт первой партии). */
export function personaCompanion(templateKey) {
  const key = Object.hasOwn(BY_TEMPLATE, templateKey) ? templateKey : 'mq_game_basic_v1';
  return { ...BY_TEMPLATE[key], persona: getPersonaPortrait(key).webp };
}
