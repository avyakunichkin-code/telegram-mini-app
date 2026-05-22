import { ScenarioSceneIcon } from '../icons/ScenarioSceneIcons';

function tierFromRank(rank) {
  const r = Number(rank);
  if (r <= 1) return { label: 'Легко', slug: 'easy' };
  if (r === 2) return { label: 'Средне', slug: 'mid' };
  if (r === 3) return { label: 'Сложно', slug: 'hard' };
  return { label: 'Экстрим', slug: 'extreme' };
}

/**
 * Выбор сценария: название + bullets старта + иконка ситуации (T2 strips ★).
 */
export function MqxStarterScenarioPicker({
  templates,
  value,
  onChange,
  disabled = false,
  labelledById,
  layout = 'strip',
}) {
  const layoutCls = layout === 'grid' ? 'mqx-scenario-picker--grid' : 'mqx-scenario-picker--strip';

  return (
    <div
      className={['mqx-scenario-picker', layoutCls].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-labelledby={labelledById}
      aria-disabled={disabled || undefined}
    >
      {(templates || []).map((t) => {
        const sel = value === t.template_key;
        const tier = tierFromRank(t.difficulty_rank);
        const highlights = Array.isArray(t.highlights) ? t.highlights : [];
        const iconKey = t.scenario_icon || 'fresh_start';

        return (
          <button
            key={t.template_key}
            type="button"
            role="radio"
            aria-checked={sel}
            disabled={disabled}
            className={[
              'mqx-scenario-strip',
              `mqx-scenario-strip--${tier.slug}`,
              sel ? 'mqx-scenario-strip--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              if (disabled) return;
              onChange(t.template_key);
            }}
          >
            <span className={`mqx-scenario-strip__icon-wrap mqx-scenario-strip__icon-wrap--${tier.slug}`} aria-hidden>
              <ScenarioSceneIcon iconKey={iconKey} className="mqx-scenario-strip__icon" />
            </span>
            <span className="mqx-scenario-strip__body">
              <span className="mqx-scenario-strip__head">
                <span className="mqx-scenario-strip__title">{t.title}</span>
                <span className={`mqx-scenario-strip__tier mq-game-tier-badge mq-game-tier-badge--${tier.slug}`}>
                  {tier.label}
                </span>
              </span>
              {highlights.length > 0 ? (
                <ul className="mqx-scenario-strip__list">
                  {highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : t.description ? (
                <p className="mqx-scenario-strip__fallback">{t.description}</p>
              ) : null}
              {t.compare_note ? <p className="mqx-scenario-strip__compare">{t.compare_note}</p> : null}
            </span>
            <span className="mqx-scenario-strip__trail" aria-hidden>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
