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
  if (needs.enabled === false) return null;
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

function overallStatus(values) {
  let worst = 'ok';
  for (const a of AXES) {
    const z = zone(values[a.key]);
    if (z === 'zero') return 'zero';
    if (z === 'distressed') worst = 'distressed';
    else if (z === 'low' && worst === 'ok') worst = 'low';
  }
  return worst;
}

function overallStatusCopy(status) {
  if (status === 'zero') return 'Критично';
  if (status === 'distressed') return 'Истощение';
  if (status === 'low') return 'Есть просадка';
  return 'Всё в норме';
}

function NeedsBarRow({ axis, value, compact = false }) {
  const pct = clampPct(value);
  const z = zone(value);
  return (
    <div className={`mqx-needs-bar-row${compact ? ' mqx-needs-bar-row--compact' : ''}`}>
      <span className="mqx-needs-bar-label">{axis.label}</span>
      <div
        className="mqx-needs-bar-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${axis.label}, ${pct} из 100, ${zoneLabel(z).toLowerCase()}`}
      >
        <span className="mqx-needs-bar-fill" data-zone={z} style={{ width: `${pct}%` }} />
      </div>
      <span className="mqx-needs-zone-text" data-zone={z}>
        {zoneLabel(z)}
      </span>
    </div>
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
  const status = useMemo(() => (values ? overallStatus(values) : 'ok'), [values]);

  if (!values || !min) return null;

  const streak = Number(needsZeroPeriodsStreak) || 0;
  const showRisk = streak > 0;
  const treatAvailable = Boolean(treatSelf?.available);
  const cooldown = Number(treatSelf?.cooldown_periods_remaining) || 0;
  const treatHint = treatAvailable
    ? 'Списание с карты · редкий запасной путь'
    : cooldown > 0
      ? `Доступно через ${cooldown} периодов`
      : 'Сейчас недоступно';

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
      aria-labelledby="needs-title"
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

        <div className="mqx-needs-main">
          <div
            className="mqx-needs-block__header"
            role="button"
            tabIndex={0}
            aria-expanded={expanded ? 'true' : 'false'}
            aria-controls="needs-panel"
            onClick={toggleExpanded}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              if (e.target.closest('.mqx-needs-improve-link, .mqx-needs-help-btn')) return;
              e.preventDefault();
              toggleExpanded();
            }}
          >
            <div className="mqx-needs-block__head-text">
              <h2 id="needs-title" className="mqx-needs-block__title mqx-finance-static__title">
                Потребности
              </h2>
              {!expanded ? (
                <p className="mqx-needs-block__summary" data-status={status}>
                  {overallStatusCopy(status)}
                </p>
              ) : null}
            </div>
            {!expanded ? (
              <button type="button" className="mqx-needs-improve-link" onClick={openHelp}>
                как улучшить →
              </button>
            ) : null}
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

          <div id="needs-panel" className="mqx-needs-panel">
            {!expanded ? (
              <div className="mqx-needs-compact">
                <NeedsBarRow axis={min} value={values[min.key]} compact />
              </div>
            ) : (
              <div className="mqx-needs-expanded">
                {AXES.map((a) => (
                  <NeedsBarRow key={a.key} axis={a} value={values[a.key]} />
                ))}
                <div className="mqx-needs-footer">
                  {treatSelf ? (
                    <button
                      type="button"
                      className="mqx-needs-treat-btn"
                      disabled={!treatAvailable}
                      title={treatHint}
                      onClick={openTreat}
                    >
                      Порадовать себя
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="mqx-needs-help-btn"
                    aria-label="Как улучшить потребности"
                    onClick={openHelp}
                  >
                    ?
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
