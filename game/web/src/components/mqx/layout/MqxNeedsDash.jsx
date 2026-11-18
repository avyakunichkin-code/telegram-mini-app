import { useId, useMemo } from 'react';

import { IconHelpQuestion, IconTreatHeartPlus } from '../icons/MqxContextHelpIcons';
import { showNotification } from '../../notifications';
import homeIcon from '../../../assets/needs/home.svg';
import rankIcon from '../../../assets/needs/rank.svg';
import linksIcon from '../../../assets/needs/links.svg';
import healthIcon from '../../../assets/needs/health.svg';
import { MqxProgress } from '../primitives/MqxProgress';
import { lowestNeedAxis, NEEDS_AXES, pluralRu } from '../utils/boardDashDisplay';

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

const ZONE_LABEL = { zero: 'критично', distressed: 'истощение', low: 'низко', ok: 'норма' };
const NEED_ICON = { comfort: homeIcon, status: rankIcon, social: linksIcon, health: healthIcon };

// Visual bands on the dashboard, independent of gameplay risk thresholds.
function meterTone(pct) {
  if (pct < 60) return 'risk';
  if (pct < 80) return 'caution';
  return 'gain';
}

function pickAxisValues(needs) {
  if (!needs || typeof needs !== 'object') return null;
  if (needs.enabled === false) return null;
  const values = {};
  for (const a of NEEDS_AXES) {
    const n = Number(needs[a.key]);
    values[a.key] = Number.isFinite(n) ? n : 0;
  }
  return values;
}

function NeedBar({ axis, value }) {
  const pct = clampPct(value);
  const z = zone(value);
  return (
    <div className="mqx-bg-need" data-zone={z}>
      <span className="mqx-bg-need__label">{axis.label}</span>
      <span className="mqx-bg-need__row">
        <img src={NEED_ICON[axis.key]} width="14" height="14" alt="" />
        <b>{pct}%</b>
      </span>
      <MqxProgress
        value={pct}
        tone={meterTone(pct)}
        className="mqx-bg-need__bar"
        aria-label={`${axis.label}, ${ZONE_LABEL[z]}`}
      />
    </div>
  );
}

/**
 * Потребности: четыре подписанные шкалы. Книга+? → help sheet, сердце → treat-self (Z-NEEDS).
 */
export function MqxNeedsDash({
  needs,
  needsZeroPeriodsStreak = 0,
  treatSelf = null,
  onTreatSelf,
  onHelp,
  className = '',
}) {
  const titleId = useId();
  const values = useMemo(() => pickAxisValues(needs), [needs]);
  const min = useMemo(() => lowestNeedAxis(needs), [needs]);

  if (!values || !min) return null;

  const streak = Number(needsZeroPeriodsStreak) || 0;
  const treatAvailable = Boolean(treatSelf?.available);
  const cooldown = Number(treatSelf?.cooldown_periods_remaining) || 0;
  const treatLockedHint =
    cooldown > 0
      ? `Разблокируется через ${cooldown} ${pluralRu(cooldown, 'ход', 'хода', 'ходов')}`
      : 'Сейчас недоступно';

  const handleTreatClick = () => {
    if (!treatAvailable) {
      showNotification(treatLockedHint, 'info', { ttlMs: 3200 });
      return;
    }
    onTreatSelf?.();
  };

  return (
    <section
      className={['mqx-bg-needs', className].filter(Boolean).join(' ')}
      data-onboarding-anchor="needs"
      aria-labelledby={titleId}
    >
      <div className="mqx-bg-needs__head">
        <h2 id={titleId} className="mqx-bg-sec-title">
          Потребности
        </h2>
        <div className="mqx-bg-needs__actions">
          <button type="button" className="mqx-bg-btn mqx-bg-icon-btn" onClick={() => onHelp?.()} aria-label="Подсказки">
            <IconHelpQuestion size={20} />
          </button>
          {treatSelf ? (
            <button
              type="button"
              className={['mqx-bg-btn', 'mqx-bg-icon-btn', !treatAvailable && 'is-disabled'].filter(Boolean).join(' ')}
              aria-disabled={!treatAvailable}
              aria-label={treatAvailable ? 'Улучшить потребности' : treatLockedHint}
              onClick={handleTreatClick}
            >
              <IconTreatHeartPlus size={18} filled={treatAvailable} />
            </button>
          ) : null}
        </div>
      </div>

      {streak > 0 ? (
        <p className="mqx-bg-needs__risk" role="status">
          {`Риск поражения: ${streak} из 3 ходов с нулём на «${min.label}»`}
        </p>
      ) : null}

      <div className="mqx-bg-needs__grid">
        {NEEDS_AXES.map((a) => (
          <NeedBar key={a.key} axis={a} value={values[a.key]} />
        ))}
      </div>
    </section>
  );
}
