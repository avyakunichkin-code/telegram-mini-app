import {
  IconMetricCoins,
  IconMetricShield,
  IconMetricTrendDown,
  IconMetricTrendUp,
} from '../icons/FinanceMetricIcons';
import { periodCloseRitualBeats, periodCloseRitualPeriodLabel } from '../../../utils/periodCloseRitual';
import {
  formatPeriodMoney,
  periodCloseBalanceHeadline,
  periodCloseDetailLines,
} from '../../../utils/periodCloseBreakdown';

const RITUAL_ICON = {
  up: IconMetricTrendUp,
  down: IconMetricTrendDown,
  coin: IconMetricCoins,
  shield: IconMetricShield,
};

function formatSignedDelta(n) {
  const v = Number(n) || 0;
  const abs = formatPeriodMoney(v);
  if (v > 0) return `+${abs}`;
  if (v < 0) return `−${abs}`;
  return '0';
}

/** ★ juice C — ритуал «ход завершён»; иконки beats ★ S4-A. */
export function MqxPeriodCloseRitual({ summary, open, onClose }) {
  if (!summary || !open) return null;

  const beats = periodCloseRitualBeats(summary);
  const periodLabel = periodCloseRitualPeriodLabel(summary);
  const headline = periodCloseBalanceHeadline(summary);
  const detailLines = periodCloseDetailLines(summary);

  return (
    <div className="mqx-juice-ritual-root mqx-juice-ritual-root--open" role="presentation">
      <section
        className="mqx-juice-ritual mqx-juice-ritual--active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-juice-ritual-title"
      >
        <div className="mqx-juice-ritual__spark" aria-hidden="true" />
        <div className="mqx-juice-ritual__scroll">
          <div className="mqx-juice-ritual__badge">Твой ход сделан</div>
          <h2 id="mqx-juice-ritual-title" className="mqx-juice-ritual__title">
            Ход завершён!
          </h2>
          <p className="mqx-juice-ritual__period">{periodLabel}</p>

          {headline ? (
            <div className="mqx-juice-ritual__balance" aria-label="Итог по счёту">
              <div className="mqx-juice-ritual__balance-main">
                <span className="mqx-juice-ritual__balance-label">На счёте</span>
                <span className="mqx-juice-ritual__balance-value">
                  {formatPeriodMoney(headline.balance)} ₽
                </span>
              </div>
              <div
                className={`mqx-juice-ritual__balance-delta${
                  headline.delta > 0
                    ? ' mqx-juice-ritual__balance-delta--pos'
                    : headline.delta < 0
                      ? ' mqx-juice-ritual__balance-delta--neg'
                      : ''
                }`}
              >
                {formatSignedDelta(headline.delta)} ₽ за ход
              </div>
              {headline.overdueAdded > 0 ? (
                <p className="mqx-juice-ritual__overdue" role="note">
                  Просрочка +{formatPeriodMoney(headline.overdueAdded)} ₽
                </p>
              ) : null}
            </div>
          ) : null}

          {beats.length > 0 ? (
            <ul className="mqx-juice-ritual__beats">
              {beats.map((beat) => {
                const Icon = RITUAL_ICON[beat.icon] || IconMetricCoins;
                return (
                  <li key={beat.id}>
                    <span
                      className={`mqx-juice-ritual__beat-icon${
                        beat.tone === 'pos'
                          ? ' mqx-juice-ritual__beat-icon--pos'
                          : beat.tone === 'neg'
                            ? ' mqx-juice-ritual__beat-icon--neg'
                            : ''
                      }`}
                      aria-hidden="true"
                    >
                      <Icon size={18} />
                    </span>
                    <span>
                      {beat.lead}
                      {beat.emphasis ? <strong>{beat.emphasis}</strong> : null}
                      {beat.tail}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {detailLines.length > 0 ? (
            <div className="mqx-juice-ritual__details">
              <h3 className="mqx-juice-ritual__details-title">Списания и начисления</h3>
              <ul className="mqx-juice-ritual__detail-list">
                {detailLines.map((line) => (
                  <li key={line.id} className="mqx-juice-ritual__detail-row">
                    <span className="mqx-juice-ritual__detail-label">{line.title}</span>
                    <span
                      className={`mqx-juice-ritual__detail-value mqx-juice-ritual__detail-value--${line.tone}`}
                    >
                      {line.tone === 'income' ? '+' : '−'}
                      {formatPeriodMoney(line.amount)} ₽
                    </span>
                    {line.note ? (
                      <span className="mqx-juice-ritual__detail-note">{line.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <button type="button" className="mqx-juice-ritual__dismiss" onClick={onClose}>
          Дальше
        </button>
      </section>
    </div>
  );
}
