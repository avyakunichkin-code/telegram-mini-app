/**
 * Клиентские дефолты игры / новых партий.
 * Для смены длительности периода здесь же — UI сейчас не спрашивает у игрока.
 */
export const DEFAULT_PERIOD_DURATION_SECONDS = 300;

/**
 * Совместимость с разными кодировками JSON (оставляем только то, что нужно карточкам каталога).
 */
/** Самый простой шаблон (минимальный difficulty_rank, затем порядок каталога). */
export function pickSimplestGameTemplate(templates) {
  if (!Array.isArray(templates) || templates.length === 0) return null;
  return [...templates].sort((a, b) => {
    const dr = (a.difficulty_rank ?? 99) - (b.difficulty_rank ?? 99);
    if (dr !== 0) return dr;
    return String(a.template_key).localeCompare(String(b.template_key));
  })[0];
}

export function normalizeStarterTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const template_key = raw.template_key ?? raw.templateKey ?? '';
  if (!String(template_key).trim()) return null;
  const title = raw.title ?? 'Сценарий';
  const dr = Number(raw.difficulty_rank ?? raw.difficultyRank ?? 1);
  const difficulty_rank = Number.isFinite(dr) ? dr : 1;
  const description = raw.description ?? raw.summary ?? null;
  return {
    template_key: String(template_key),
    title: String(title),
    difficulty_rank,
    description: typeof description === 'string' ? description : null,
  };
}
