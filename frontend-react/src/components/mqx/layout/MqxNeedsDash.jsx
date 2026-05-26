import { useMemo, useState } from 'react';

import studentMascotPng from '../../../assets/character-needs/student-mascot.png';
import studentMascotWebp from '../../../assets/character-needs/student-mascot.webp';

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
  for (const a of AXES) {
    const n = Number(needs[a.key]);
    values[a.key] = Number.isFinite(n) ? n : 0;
  }
  return values;
}

function minAxis(values) {
  let min = AXES[0];
  for (const a of AXES) {
    if (Number(values[a.key]) < Number(values[min.key])) min = a;
  }
  return min;
}

function ImproveIcon() {
  return (
    <svg className="mqx-needs-improve-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v15" strokeLinecap="round" />
      <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NeedsBarRow({ axis, value }) {
  const pct = clampPct(value);
  const z = zone(value);
  return (
    <div className="mqx-needs-bar-row">
      <span className="mqx-needs-bar-label">{axis.label}</span>
      <div
        className="mqx-needs-bar-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${axis.label}, ${zoneLabel(z)}`}
      >
        <span className="mqx-needs-bar-fill" data-zone={z} style={{ width: `${pct}%` }} />
      </div>
      <span className="mqx-needs-zone-text" data-zone={z}>
        {zoneLabel(z)}
      </span>
    </div>
  );
}

function ImproveChipButton({ disabled, title, onClick }) {
  return (
    <button
      type="button"
      className="mqx-needs-improve-chip"
      aria-label="Улучшить"
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <ImproveIcon />
      <span className="mqx-needs-sr-only">Улучшить</span>
    </button>
  );
}

export function MqxNeedsDash({
  needs,
  needsZeroPeriodsStreak = 0,
  treatSelf = null,
  onTreatSelf,
  onHelp,
  className = '',
}) {
  const values = useMemo(() => pickAxisValues(needs), [needs]);
  const [expanded, setExpanded] = useState(false);

  const min = useMemo(() => (values ? minAxis(values) : null), [values]);

  if (!values || !min) return null;

  const streak = Number(needsZeroPeriodsStreak) || 0;
  const showRisk = streak > 0;
  const treatAvailable = Boolean(treatSelf?.available);
  const treatTitle = treatAvailable
    ? 'Улучшить самочувствие'
    : `Доступно через ${treatSelf?.cooldown_periods_remaining ?? 0} периодов`;

  const openTreat = (e) => {
    e.stopPropagation();
    if (!treatAvailable) return;
    onTreatSelf?.();
  };

  const openHelp = (e) => {
    e.stopPropagation();
    onHelp?.();
  };

  const toggleExpanded = () => setExpanded((v) => !v);

  return (
    <section
      className={[
        'mqx-needs-block',
        expanded && 'is-expanded',
        showRisk && 'is-bleed-risk',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-lab-variant="v4"
      aria-label="Самочувствие"
    >
      <div
        className={['mqx-needs-risk', showRisk && 'is-visible'].filter(Boolean).join(' ')}
        role="alert"
        hidden={!showRisk}
      >
        {showRisk
          ? `Риск поражения: ${streak} из 3 месяцев с нулём на «${min.label}»`
          : null}
      </div>

      <div className="mqx-needs-body">
        <div className="mqx-needs-avatar" aria-hidden="true">
          <picture>
            <source type="image/webp" srcSet={studentMascotWebp} />
            <img
              src={studentMascotPng}
              alt=""
              width={129}
              height={108}
              className="mqx-needs-avatar__img"
              decoding="async"
              draggable={false}
            />
          </picture>
        </div>

        <div
          className="mqx-needs-block__header"
          role="button"
          tabIndex={0}
          aria-expanded={expanded ? 'true' : 'false'}
          onClick={toggleExpanded}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            if (e.target.closest('.mqx-needs-improve-link')) return;
            e.preventDefault();
            toggleExpanded();
          }}
        >
          <span className="mqx-needs-block__title">Самочувствие</span>
          <button type="button" className="mqx-needs-improve-link" onClick={openHelp}>
            как улучшить →
          </button>
          <svg
            className="mqx-needs-block__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="mqx-needs-compact">
          <NeedsBarRow axis={min} value={values[min.key]} />
        </div>

        {!expanded ? (
          <ImproveChipButton
            disabled={!treatAvailable}
            title={treatTitle}
            onClick={openTreat}
          />
        ) : null}

        <div className="mqx-needs-expanded">
          {AXES.map((a) => (
            <NeedsBarRow key={a.key} axis={a} value={values[a.key]} />
          ))}
          {treatSelf ? (
            <div className="mqx-needs-improve-zone">
              <button
                type="button"
                className="mqx-needs-improve mqx-needs-improve--ghost-center"
                aria-label="Улучшить"
                disabled={!treatAvailable}
                title={treatTitle}
                onClick={openTreat}
              >
                <ImproveIcon />
                <span className="mqx-needs-sr-only">Улучшить</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
