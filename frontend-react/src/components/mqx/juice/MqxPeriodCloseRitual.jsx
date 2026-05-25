import { periodCloseRitualBeats, periodCloseRitualPeriodLabel } from '../../../utils/periodCloseRitual';

/** ★ juice C — ритуал «ход завершён» вместо компактной таблицы. */
export function MqxPeriodCloseRitual({ summary, open, onClose }) {
  if (!summary || !open) return null;

  const beats = periodCloseRitualBeats(summary);
  const periodLabel = periodCloseRitualPeriodLabel(summary);

  return (
    <div className="mqx-juice-ritual-root mqx-juice-ritual-root--open" role="presentation">
      <section
        className="mqx-juice-ritual mqx-juice-ritual--active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-juice-ritual-title"
      >
        <div className="mqx-juice-ritual__spark" aria-hidden="true" />
        <div className="mqx-juice-ritual__badge">Твой ход сделан</div>
        <h2 id="mqx-juice-ritual-title" className="mqx-juice-ritual__title">
          Ход завершён!
        </h2>
        <p className="mqx-juice-ritual__period">{periodLabel}</p>
        <ul className="mqx-juice-ritual__beats">
          {beats.map((beat) => (
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
                {beat.icon}
              </span>
              <span>
                {beat.lead}
                {beat.emphasis ? <strong>{beat.emphasis}</strong> : null}
                {beat.tail}
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="mqx-juice-ritual__dismiss" onClick={onClose}>
          Дальше
        </button>
      </section>
    </div>
  );
}
