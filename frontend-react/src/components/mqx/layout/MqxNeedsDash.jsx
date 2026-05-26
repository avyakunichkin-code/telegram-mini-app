import { useMemo, useState } from 'react';

import { IllustrationScenarioStudent } from '../icons/ScenarioIllustrations';

const AXES = [
  { key: 'comfort', label: 'Комфорт' },
  { key: 'status', label: 'Статус' },
  { key: 'social', label: 'Связи' },
  { key: 'health', label: 'Здоровье' },
];

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function zone(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 'zero';
  if (n < 30) return 'distressed';
  if (n < 40) return 'low';
  return 'ok';
}

function zoneLabel(z) {
  if (z === 'zero') return 'Критично';
  if (z === 'distressed') return 'Истощение';
  if (z === 'low') return 'Низко';
  return 'Норма';
}

function pickAxisValues(needs) {
  if (!needs || typeof needs !== 'object') return null;
  const values = {};
  for (const a of AXES) values[a.key] = needs[a.key];
  const hasAny = AXES.some((a) => Number.isFinite(Number(values[a.key])));
  return hasAny ? values : null;
}

function minAxis(values) {
  let min = AXES[0];
  for (const a of AXES) {
    if (Number(values[a.key]) < Number(values[min.key])) min = a;
  }
  return min;
}

function NeedsBarRow({ axis, value }) {
  const pct = clampPct(value);
  const z = zone(value);
  return (
    <div className="mqx-needs__bar-row">
      <span className="mqx-needs__bar-label">{axis.label}</span>
      <div
        className="mqx-needs__bar-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${axis.label}, ${zoneLabel(z)}`}
      >
        <span className="mqx-needs__bar-fill" data-zone={z} style={{ width: `${pct}%` }} />
      </div>
      <span className="mqx-needs__zone-text" data-zone={z}>
        {zoneLabel(z)}
      </span>
    </div>
  );
}

export function MqxNeedsDash({
  needs,
  needsZeroPeriodsStreak = 0,
  onImprove,
  className = '',
}) {
  const values = useMemo(() => pickAxisValues(needs), [needs]);
  const [expanded, setExpanded] = useState(false);

  const min = useMemo(() => (values ? minAxis(values) : null), [values]);

  if (!values || !min) return null;

  const showRisk = Number(needsZeroPeriodsStreak) > 0;

  return (
    <section
      className={[
        'mqx-needs',
        expanded && 'is-expanded',
        showRisk && 'is-bleed-risk',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Самочувствие"
    >
      {showRisk ? (
        <div className="mqx-needs__risk" role="alert">
          Риск поражения: {needsZeroPeriodsStreak} из 3 месяцев с нулём на «{min.label}»
        </div>
      ) : null}

      <div className="mqx-needs__body">
        <div className="mqx-needs__avatar" aria-hidden="true">
          <IllustrationScenarioStudent className="mqx-needs__avatar-illus" />
        </div>

        <div
          className="mqx-needs__header"
          role="button"
          tabIndex={0}
          aria-expanded={expanded ? 'true' : 'false'}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            setExpanded((v) => !v);
          }}
        >
          <span className="mqx-needs__title">Самочувствие</span>
          <button
            type="button"
            className="mqx-needs__improve-link"
            onClick={(e) => {
              e.stopPropagation();
              onImprove?.();
            }}
          >
            как улучшить?
          </button>
          <svg
            className="mqx-needs__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="mqx-needs__compact">
          <NeedsBarRow axis={min} value={values[min.key]} />
        </div>

        <button
          type="button"
          className="mqx-needs__improve-cta"
          aria-label="Улучшить"
          onClick={(e) => {
            e.stopPropagation();
            onImprove?.();
          }}
        >
          <svg className="mqx-needs__improve-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v15" stroke="currentColor" strokeLinecap="round" />
            <path
              d="M7 9l5-5 5 5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mqx-needs__expanded">
          {AXES.map((a) => (
            <NeedsBarRow key={a.key} axis={a} value={values[a.key]} />
          ))}
        </div>
      </div>
    </section>
  );
}

