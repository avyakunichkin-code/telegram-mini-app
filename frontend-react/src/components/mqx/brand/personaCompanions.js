/**
 * Персонаж + напарник ★ companions-round (PO 2026-11-02). Арт — экспорт `design/system/illustrations/characters.js`
 * (`design/system/assets/Characters|Companions`, через asset-exports.json). Цвета зашиты и от темы не зависят.
 */
import studentChibi from '../../../assets/companions/student-chibi.svg';
import proChibi from '../../../assets/companions/pro-chibi.svg';
import bossChibi from '../../../assets/companions/boss-chibi.svg';
import bizChibi from '../../../assets/companions/biz-chibi.svg';
import studbilet from '../../../assets/companions/studbilet.svg';
import card from '../../../assets/companions/card.svg';
import briefcase from '../../../assets/companions/briefcase.svg';
import phone from '../../../assets/companions/phone.svg';

/** template_key → пара; строки — из раунда (вариант B «Карточка персонажа»). */
const BY_TEMPLATE = {
  mq_game_basic_v1: {
    name: 'Студент',
    line: 'Чистый старт — без долгов и активов',
    persona: studentChibi,
    companion: studbilet,
    companionName: 'Студбилет',
  },
  mq_game_tight_budget_v1: {
    name: 'Профессионал',
    line: 'Аренда, авто и автокредит с первого периода',
    persona: proChibi,
    companion: card,
    companionName: 'Зарплатная карта',
  },
  mq_game_mortgage_stress_v1: {
    name: 'Руководитель',
    line: 'Своё жильё, ипотека и два автомобиля',
    persona: bossChibi,
    companion: briefcase,
    companionName: 'Портфель',
  },
  mq_game_debt_stack_v1: {
    name: 'Предприниматель',
    line: 'Ипотека, два авто и кредитная карта',
    persona: bizChibi,
    companion: phone,
    companionName: 'Смартфон',
  },
};

/** @returns пара для экрана знакомства; неизвестный шаблон — Студент (как авто-старт первой партии). */
export function personaCompanion(templateKey) {
  return BY_TEMPLATE[templateKey] || BY_TEMPLATE.mq_game_basic_v1;
}
