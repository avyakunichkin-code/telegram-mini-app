/**
 * Выбор игрового шаблона старта: карточки вместо выпадающего списка (сканируемость, сложность на виду).
 */

function tierFromRank(rank) {
  const r = Number(rank);
  if (r <= 1) return { label: 'Легко', slug: 'easy' };
  if (r === 2) return { label: 'Средне', slug: 'mid' };
  if (r === 3) return { label: 'Сложно', slug: 'hard' };
  return { label: 'Экстрим', slug: 'extreme' };
}

export function GameStarterPicker({
  templates,
  value,
  onChange,
  disabled = false,
  labelledById,
  /** Ручной сценарий уходит в режим План; в потоке Game обычно false */
  showManualOption = false,
}) {
  const manualSelected = showManualOption && value == null;

  return (
    <div
      className="mq-game-template-picker"
      role="radiogroup"
      aria-labelledby={labelledById}
      aria-disabled={disabled || undefined}
    >
      <div className="mq-game-template-grid">
        {(templates || []).map((t) => {
          const sel = value === t.template_key;
          const tier = tierFromRank(t.difficulty_rank);
          return (
            <button
              key={t.template_key}
              type="button"
              role="radio"
              aria-checked={sel}
              disabled={disabled}
              className={`mq-game-template-card mq-game-template-card--${tier.slug}${sel ? ' mq-game-template-card--selected' : ''}`}
              onClick={() => onChange(t.template_key)}
            >
              <span className={`mq-game-template-card__tier mq-game-tier-badge mq-game-tier-badge--${tier.slug}`}>{tier.label}</span>
              <span className="mq-game-template-card__title">{t.title}</span>
              {t.description ? (
                <span className="mq-game-template-card__desc">{t.description}</span>
              ) : null}
            </button>
          );
        })}

        {showManualOption ? (
          <button
            type="button"
            role="radio"
            aria-checked={manualSelected}
            disabled={disabled}
            className={`mq-game-template-card mq-game-template-card--manual${manualSelected ? ' mq-game-template-card--selected' : ''}`}
            onClick={() => onChange(null)}
          >
            <span className="mq-game-template-card__title">Свой сценарий</span>
            <span className="mq-game-template-card__desc">
              Задайте стартовый баланс, зарплату, активы и долги на следующем шаге.
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
