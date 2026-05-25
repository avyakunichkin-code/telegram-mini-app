import { ScenarioIllustrationIcon } from '../icons/ScenarioIllustrations';
import { tierFromRank } from '../../../utils/starterTemplateTier';

const COMPACT_MAX_BULLETS = 2;

/**
 * Выбор сценария: название + bullets + цветовая полоска и иконка на градиенте.
 * layout: compact — 2 bullets, без compare (утверждённый шаг 2).
 */
export function MqxStarterScenarioPicker({
  templates,
  value,
  onChange,
  disabled = false,
  labelledById,
  layout = 'compact',
  tbGlass = true,
}) {
  const isCompact = layout === 'compact';
  const isGrid = layout === 'grid';
  const layoutCls = isGrid
    ? 'mqx-scenario-picker--grid'
    : isCompact
      ? 'mqx-scenario-picker--compact'
      : 'mqx-scenario-picker--strip';

  return (
    <div
      className={[
        'mqx-scenario-picker',
        'mqx-scenario-picker--illus',
        layoutCls,
        tbGlass ? 'mqx-scenario-picker--tb-glass' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="radiogroup"
      aria-labelledby={labelledById}
      aria-disabled={disabled || undefined}
    >
      {(templates || []).map((t) => {
        const sel = value === t.template_key;
        const tier = tierFromRank(t.difficulty_rank);
        const highlights = Array.isArray(t.highlights) ? t.highlights : [];
        const visibleHighlights = isCompact ? highlights.slice(0, COMPACT_MAX_BULLETS) : highlights;
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
            <span
              className={`mqx-scenario-strip__icon-wrap mqx-scenario-strip__icon-wrap--${tier.slug}`}
              aria-hidden
            >
              <ScenarioIllustrationIcon iconKey={iconKey} />
            </span>
            <span className="mqx-scenario-strip__body">
              <span className="mqx-scenario-strip__head">
                <span className="mqx-scenario-strip__title">{t.title}</span>
              </span>
              {visibleHighlights.length > 0 ? (
                <ul className="mqx-scenario-strip__list">
                  {visibleHighlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : t.description ? (
                <p className="mqx-scenario-strip__fallback">{t.description}</p>
              ) : null}
              {!isCompact && t.compare_note ? (
                <p className="mqx-scenario-strip__compare">{t.compare_note}</p>
              ) : null}
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
