import { API } from '../api';
import { DEFAULT_PERIOD_DURATION_SECONDS, normalizeStarterTemplate, pickSimplestGameTemplate } from '../config/gameDefaults';

/** Автостарт Game Mode с шаблоном «Студент» (первая партия). */
export async function startGameWithStudentTemplate(profileName) {
  const name = String(profileName || '').trim();
  if (!name) {
    throw new Error('Введите название сохранения');
  }
  return API.startNewGame({
    profile_name: name,
    save_kind: 'game',
    template_key: 'mq_game_basic_v1',
    period_duration_seconds: DEFAULT_PERIOD_DURATION_SECONDS,
  });
}

/** Автостарт Game Mode с самым простым шаблоном каталога. */
export async function startGameWithSimplestTemplate(profileName) {
  const name = String(profileName || '').trim();
  if (!name) {
    throw new Error('Введите название сохранения');
  }
  const rows = await API.listGameTemplates('game');
  const list = (Array.isArray(rows) ? rows : []).map(normalizeStarterTemplate).filter(Boolean);
  const template = pickSimplestGameTemplate(list);
  if (!template?.template_key) {
    throw new Error('Нет доступных шаблонов игры');
  }
  return API.startNewGame({
    profile_name: name,
    save_kind: 'game',
    template_key: template.template_key,
    period_duration_seconds: DEFAULT_PERIOD_DURATION_SECONDS,
  });
}
