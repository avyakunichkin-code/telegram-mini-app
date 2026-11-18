import { KvityaReceipt } from '../brand/KvityaReceipt';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { periodCloseMonetkaLine, periodCloseRitualPeriodLabel } from '../../../utils/periodCloseRitual';
import {
  PERIOD_CLOSE_SPAWN_FAILED_COPY,
  periodCloseEventsSpawnFailed,
} from '../../../utils/periodCloseDisplay';
import {
  formatPeriodMoney,
  periodCloseBalanceHeadline,
  periodCloseDetailLines,
} from '../../../utils/periodCloseBreakdown';

function formatSignedDelta(n) {
  const v = Number(n) || 0;
  const abs = formatPeriodMoney(v);
  if (v > 0) return `+${abs}`;
  if (v < 0) return `−${abs}`;
  return '0';
}

/** Строчки чека: начисления и списания хода, просрочка — отдельной строкой. */
function receiptRows(detailLines, headline) {
  const rows = detailLines.map((line) => ({
    id: line.id,
    label: line.note ? `${line.title} · ${line.note}` : line.title,
    value: `${line.tone === 'income' ? '+' : '−'}${formatPeriodMoney(line.amount)} ₽`,
    tone: line.tone === 'income' ? 'gain' : undefined,
  }));
  if (headline.overdueAdded > 0) {
    rows.push({
      id: 'overdue',
      label: 'Просрочка',
      value: `+${formatPeriodMoney(headline.overdueAdded)} ₽`,
      tone: 'loss',
    });
  }
  return rows;
}

/**
 * Итоги хода ★ ink-mascots-round (PO 2026-11-02): чек-Квитя распечатывает ход, Монетка комментирует ниже.
 * Прежний ритуал ★ juice C (бейдж, «удары» с иконками) заменён.
 */
export function MqxPeriodCloseRitual({ summary, open, onClose }) {
  if (!summary || !open) return null;

  const periodLabel = periodCloseRitualPeriodLabel(summary);
  const headline = periodCloseBalanceHeadline(summary);
  const detailLines = periodCloseDetailLines(summary);
  const monetkaLine = periodCloseMonetkaLine(summary);

  return (
    <div className="mqx-juice-ritual-root mqx-juice-ritual-root--open" role="presentation">
      <section
        className="mqx-juice-ritual mqx-juice-ritual--active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-juice-ritual-title"
      >
        <div className="mqx-juice-ritual__scroll">
          <h2 id="mqx-juice-ritual-title" className="mqx-juice-ritual__title">
            {periodLabel}
          </h2>
          <p className="mqx-juice-ritual__sub">Квитя распечатала, что случилось за ход.</p>
          {periodCloseEventsSpawnFailed(summary) ? (
            <p className="mqx-juice-ritual__spawn-fail" role="status">
              {PERIOD_CLOSE_SPAWN_FAILED_COPY}
            </p>
          ) : null}

          {headline ? (
            <KvityaReceipt
              rows={receiptRows(detailLines, headline)}
              total={{ label: 'Итого за ход', value: `${formatSignedDelta(headline.delta)} ₽` }}
              footer={[{ label: 'На счёте', value: `${formatPeriodMoney(headline.balance)} ₽` }]}
            />
          ) : null}

          {monetkaLine ? (
            <div className="mqx-juice-ritual__tip">
              <MonetkaAvatar size={40} />
              <p className="mqx-juice-ritual__bubble">{monetkaLine}</p>
            </div>
          ) : null}
        </div>

        <button type="button" className="mqx-juice-ritual__dismiss" onClick={onClose}>
          Следующий ход
        </button>
      </section>
    </div>
  );
}
