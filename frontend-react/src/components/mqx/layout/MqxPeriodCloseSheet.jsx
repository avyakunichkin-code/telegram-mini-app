import {
  IconMetricCoins,
  IconMetricPercent,
  IconMetricTrendDown,
  IconMetricTrendUp,
} from '../icons/FinanceMetricIcons';
import { periodCloseRows, periodCloseTitle } from '../../../utils/periodCloseDisplay';
import { formatPeriodMoney, periodCloseDetailLines } from '../../../utils/periodCloseBreakdown';

const GLYPHS = {
  coin: IconMetricCoins,
  up: IconMetricTrendUp,
  down: IconMetricTrendDown,
  percent: IconMetricPercent,
};

function formatSignedDelta(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(Math.round(v)).toLocaleString('ru-RU');
  if (v > 0) return `+${abs}`;
  if (v < 0) return `−${abs}`;
  return '0';
}

function DeltaArrow({ delta }) {
  if (delta > 0) {
    return (
      <span className="mqx-pclose-row__arrow mqx-pclose-row__arrow--up" aria-hidden>
        <IconMetricTrendUp size={14} />
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="mqx-pclose-row__arrow mqx-pclose-row__arrow--down" aria-hidden>
        <IconMetricTrendDown size={14} />
      </span>
    );
  }
  return <span className="mqx-pclose-row__arrow mqx-pclose-row__arrow--flat" aria-hidden>—</span>;
}

function PeriodCloseRow({ row }) {
  const Icon = GLYPHS[row.glyph] || IconMetricCoins;
  const tone = row.tone || '';

  return (
    <li className="mqx-pclose-row">
      <span className={`mqx-pclose-row__glyph mqx-metric-glyph mqx-metric-glyph--${row.glyph}`} aria-hidden>
        <Icon size={16} />
      </span>
      <span className="mqx-pclose-row__label">{row.label}</span>
      <span className={`mqx-pclose-row__value${tone ? ` mqx-pclose-row__value--${tone}` : ''}`}>
        <DeltaArrow delta={row.delta} />
        <span className="mqx-pclose-row__money">
          {formatSignedDelta(row.delta)}
          <span className="mq-money__unit">&nbsp;₽</span>
        </span>
      </span>
    </li>
  );
}

/**
 * Компактный итог периода — нижний лист, без прокрутки.
 */
export function MqxPeriodCloseSheet({ summary, open, onClose }) {
  if (!summary || !open) return null;

  const rows = periodCloseRows(summary);
  const title = periodCloseTitle(summary);
  const detailLines = periodCloseDetailLines(summary);

  return (
    <div className="mqx-pclose-root" role="presentation">
      <button type="button" className="mqx-pclose-scrim" aria-label="Закрыть итоги" onClick={onClose} />
      <section
        className="mqx-pclose-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-pclose-title"
      >
        <button type="button" className="mqx-pclose-sheet__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="mqx-pclose-title" className="mqx-pclose-sheet__title">
          {title}
        </h2>
        <ul className="mqx-pclose-sheet__rows">
          {rows.map((row) => (
            <PeriodCloseRow key={row.key} row={row} />
          ))}
        </ul>
        {detailLines.length > 0 ? (
          <div className="mqx-pclose-sheet__details">
            <h3 className="mqx-pclose-sheet__details-title">Детализация</h3>
            <ul className="mqx-pclose-sheet__detail-list">
              {detailLines.map((line) => (
                <li key={line.id} className="mqx-pclose-sheet__detail-row">
                  <span className="mqx-pclose-sheet__detail-label">{line.title}</span>
                  <span className={`mqx-pclose-sheet__detail-value mqx-pclose-sheet__detail-value--${line.tone}`}>
                    {line.tone === 'income' ? '+' : '−'}
                    {formatPeriodMoney(line.amount)} ₽
                  </span>
                  {line.note ? <span className="mqx-pclose-sheet__detail-note">{line.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
