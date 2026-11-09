export const PLAYTEST_SURVEY_KEY = 'first_turns_v2';
export const SURVEY_QUESTIONS_V1 = [
  { key: 'salary', title: 'Понятно, когда получать зарплату?', options: [['yes', 'Да'], ['partly', 'Частично'], ['no', 'Нет']] },
  { key: 'safety', title: 'Понятна разница между счётом и подушкой?', options: [['yes', 'Да'], ['partly', 'Частично'], ['no', 'Нет']] },
  { key: 'close', title: 'Понятно, сколько спишется при завершении хода?', options: [['yes', 'Да'], ['partly', 'Частично'], ['no', 'Нет']] },
  { key: 'blocked', title: 'Было место, где не смог продолжить?', options: [[false, 'Нет'], [true, 'Да']] },
  { key: 'continue_playing', title: 'Хочется сыграть ещё несколько ходов?', options: [['yes', 'Да'], ['unsure', 'Не уверен'], ['no', 'Нет']] },
];
const yesOptions = [['yes', 'Да'], ['partly', 'Частично'], ['no', 'Нет']];
export const SURVEY_QUESTIONS = [
  ...SURVEY_QUESTIONS_V1.slice(0, 2),
  { key: 'safety_transfer', title: 'Понятно, как перевести деньги в подушку и обратно?', options: yesOptions },
  { key: 'expense_buffer', title: 'Понятно, зачем на счёте нужен запас на расходы?', options: yesOptions },
  SURVEY_QUESTIONS_V1[2],
  { key: 'close_result', title: 'Понятно, что изменилось после завершения хода?', options: yesOptions },
  SURVEY_QUESTIONS_V1[3],
  { key: 'difficulty', title: 'Как тебе сложность игры?', options: [['easy', 'Легко'], ['normal', 'Нормально'], ['hard', 'Сложно']] },
  SURVEY_QUESTIONS_V1[4],
];
export function surveyQuestionsForVersion(key) {
  return key === 'first_turns_v1' ? SURVEY_QUESTIONS_V1 : key === PLAYTEST_SURVEY_KEY ? SURVEY_QUESTIONS : [];
}
export const SURVEY_STEPS = [
  { title: 'Деньги и подушка', questions: SURVEY_QUESTIONS.slice(0, 4) },
  { title: 'Завершение хода', questions: SURVEY_QUESTIONS.slice(4, 7) },
  { title: 'Впечатления и отзыв', questions: SURVEY_QUESTIONS.slice(7) },
];
export function isSurveyStepComplete(step, answers) {
  return SURVEY_STEPS[step]?.questions.every(q => q.options.some(([value]) => value === answers[q.key])) ?? false;
}
export function shouldOfferPlaytestSurvey({ survey, blocked, pendingEvents, activeTab, sessionShown }) {
  return Boolean(survey?.should_offer && survey?.can_submit && !blocked && !pendingEvents
    && activeTab === 'dashboard' && !sessionShown);
}
