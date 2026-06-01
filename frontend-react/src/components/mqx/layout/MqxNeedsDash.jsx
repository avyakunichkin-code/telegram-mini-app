import { useMemo } from 'react';

import {
  IconHelpBook,
  IconHelpBookQuestionInside,
  IconHelpBookWithBadge,
  IconTreatHeart,
} from '../icons/MqxContextHelpIcons';
import { showNotification } from '../../notifications';
import { PersonaPortrait } from '../brand/PersonaPortrait';

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

/** @typedef {'a' | 'e1' | 'e2' | 'e3'} MqxNeedsActionsVariant */

function NeedsHeadActions({
  variant,
  onHelp,
  treatSelf,
  treatAvailable,
  treatLockedHint,
  onTreatClick,
}) {
  const helpLabel = 'Подсказки';
  const treatLabel = treatAvailable ? 'Улучшить потребности' : treatLockedHint;

  const treatBtn = (className, { filled = false } = {}) =>
    treatSelf ? (
      <button
        type="button"
        className={[className, !treatAvailable && 'is-disabled'].filter(Boolean).join(' ')}
        aria-disabled={!treatAvailable}
        aria-label={treatLabel}
        onClick={onTreatClick}
      >
        <IconTreatHeart filled={filled} />
        <span className="mqx-needs-sr-only">Улучшить</span>
      </button>
    ) : null;

  if (variant === 'e1') {
    return (
      <div className="mqx-needs-actions">
        <button type="button" className="mqx-help-icon-btn" onClick={() => onHelp?.()} aria-label={helpLabel}>
          <IconHelpBook size={17} />
        </button>
        {treatBtn('mqx-treat-heart-btn')}
      </div>
    );
  }

  if (variant === 'e2') {
    return (
      <div className="mqx-needs-actions">
        <button
          type="button"
          className="mqx-help-icon-btn mqx-help-icon-btn--badge"
          onClick={() => onHelp?.()}
          aria-label={helpLabel}
        >
          <IconHelpBookWithBadge size={17} />
          <span className="mqx-help-icon-btn__badge" aria-hidden="true">
            ?
          </span>
        </button>
        {treatBtn('mqx-treat-heart-btn mqx-treat-heart-btn--ghost')}
      </div>
    );
  }

  if (variant === 'e3') {
    return (
      <div className="mqx-needs-actions">
        <button
          type="button"
          className="mqx-help-icon-btn mqx-help-icon-btn--inside"
          onClick={() => onHelp?.()}
          aria-label={helpLabel}
        >
          <IconHelpBookQuestionInside size={16} />
        </button>
        {treatBtn('mqx-treat-heart-btn mqx-treat-heart-btn--dot', { filled: true })}
      </div>
    );
  }

  return (
    <div className="mqx-needs-actions">
      <button type="button" className="mqx-needs-help-link" onClick={() => onHelp?.()}>
        Подсказки
        <span className="mqx-needs-help-link__arrow" aria-hidden="true">
          →
        </span>
      </button>
      {treatSelf ? (
        <button
          type="button"
          className={['mqx-needs-action', 'mqx-needs-action--treat', !treatAvailable && 'is-disabled']
            .filter(Boolean)
            .join(' ')}
          aria-disabled={!treatAvailable}
          aria-label={treatLabel}
          onClick={onTreatClick}
        >
          Улучшить
        </button>
      ) : null}
    </div>
  );
}

/**
 * Z-NEEDS v7: заголовок секции снаружи, 4 шкалы без accordion.
 * Lab: design-lab/character-needs/dashboard-needs-v7-round/ (e1–e3 иконки, v7-A архив).
 */
export function MqxNeedsDash({
  needs,
  templateKey = null,
  needsZeroPeriodsStreak = 0,
  treatSelf = null,
  onTreatSelf,
  onHelp,
  /** @type {MqxNeedsActionsVariant} */
  actionsVariant = 'e1',
  className = '',
}) {
  const values = useMemo(() => pickAxisValues(needs), [needs]);
  const min = useMemo(() => (values ? minAxis(values) : null), [values]);

  if (!values || !min) return null;

  const streak = Number(needsZeroPeriodsStreak) || 0;
  const showRisk = streak > 0;
  const treatAvailable = Boolean(treatSelf?.available);
  const cooldown = Number(treatSelf?.cooldown_periods_remaining) || 0;
  const treatLockedHint =
    cooldown > 0 ? `Разблокируется через ${cooldown} периодов` : 'Сейчас недоступно';

  const handleTreatClick = () => {
    if (!treatAvailable) {
      showNotification(treatLockedHint, 'info', { ttlMs: 3200 });
      return;
    }
    onTreatSelf?.();
  };

  return (
    <section
      className={['mqx-needs-section', className].filter(Boolean).join(' ')}
      data-actions="a"
      aria-labelledby="needs-section-title"
    >
      <div className="mqx-needs-section__head">
        <h2 id="needs-section-title" className="mqx-finance-static__title">
          Потребности
        </h2>
        <div className="mqx-needs-actions">
          <button type="button" className="mqx-needs-help-link" onClick={() => onHelp?.()}>
            Подсказки
            <span className="mqx-needs-help-link__arrow" aria-hidden="true">
              →
            </span>
          </button>
          {treatSelf ? (
            <button
              type="button"
              className={[
                'mqx-needs-action',
                'mqx-needs-action--treat',
                !treatAvailable && 'is-disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-disabled={!treatAvailable}
              aria-label={treatAvailable ? 'Улучшить потребности' : treatLockedHint}
              onClick={handleTreatClick}
            >
              Улучшить
            </button>
          ) : null}
        </div>
      </div>

      <div className="mqx-needs-block">
        {showRisk ? (
          <div className="mqx-needs-risk is-visible" role="alert">
            {`Риск поражения: ${streak} из 3 месяцев с нулём на «${min.label}»`}
          </div>
        ) : null}

        <div className="mqx-needs-body">
          <div className="mqx-needs-avatar" aria-hidden="true">
            <PersonaPortrait
              templateKey={templateKey || 'mq_game_basic_v1'}
              size="dash"
              className="mqx-needs-avatar__persona"
            />
          </div>
          <div className="mqx-needs-bars">
            {AXES.map((a) => (
              <NeedsBarRow key={a.key} axis={a} value={values[a.key]} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
