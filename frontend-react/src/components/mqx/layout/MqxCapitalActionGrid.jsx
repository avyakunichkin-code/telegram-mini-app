/**
 * «Действия» ★ BG-2: фишки 3 в ряд по группам «Вложить / Купить / Занять».
 * Закрытые механики видны пунктиром и «откроется по цели» (mechanics_unlock), скрытые шаблоном — нет.
 */
const ACTION_GROUPS = [
  {
    id: 'invest',
    title: 'Вложить',
    hint: 'доход каждый ход',
    pieces: [
      { id: 'deposit', section: 'invest', glyph: '%', title: 'Вклад' },
      { id: 'bond', section: 'invest', glyph: '₽', title: 'Облигации' },
      { id: 'insurance', section: 'insurance', glyph: '✓', title: 'Страховка', tone: 'ins' },
    ],
  },
  {
    id: 'buy',
    title: 'Купить',
    hint: 'доход или удобство',
    pieces: [
      { id: 'realestate', section: 'property', glyph: '⌂', title: 'Жильё', tone: 'prop' },
      { id: 'car', section: 'property', glyph: '◐', title: 'Авто', tone: 'prop' },
    ],
  },
  {
    id: 'borrow',
    title: 'Занять',
    hint: 'деньги сейчас, платёж каждый ход',
    pieces: [
      { id: 'credit', section: 'liabilities', glyph: '−', title: 'Кредит', tone: 'debt' },
      { id: 'mortgage', section: 'liabilities', glyph: '⌂', title: 'Ипотека', tone: 'debt' },
    ],
  },
];

const LOCKED_NOTE = 'откроется по цели';

/**
 * @param {{
 *   sections: Record<string, 'open'|'locked'|'hidden'>,
 *   notes?: Record<string, string|null>,
 *   lockHint?: string|null,
 *   onOpenSheet: (id: string) => void,
 * }} props
 */
export function MqxCapitalActionGrid({ sections, notes = {}, lockHint = null, onOpenSheet }) {
  const groups = ACTION_GROUPS.map((g) => ({
    ...g,
    pieces: g.pieces
      .map((p) => ({ ...p, state: sections?.[p.section] || 'hidden' }))
      .filter((p) => p.state !== 'hidden'),
  })).filter((g) => g.pieces.length > 0);

  if (groups.length === 0) return null;
  const anyLocked = groups.some((g) => g.pieces.some((p) => p.state === 'locked'));

  return (
    <div className="mqx-cap-acts" role="tabpanel" id="capital-panel-actions" aria-labelledby="capital-tab-actions">
      {groups.map((g) => (
        <section key={g.id} className="mqx-cap-acts__group" aria-labelledby={`capital-acts-${g.id}`}>
          <div className="mqx-cap-acts__head">
            <h2 id={`capital-acts-${g.id}`} className="mqx-cap-acts__title">
              {g.title}
            </h2>
            <span className="mqx-cap-acts__hint">{g.hint}</span>
          </div>
          <div className="mqx-cap-pieces">
            {g.pieces.map((p) => {
              const locked = p.state === 'locked';
              const note = locked ? LOCKED_NOTE : notes[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  className={[
                    'mqx-bg-btn',
                    'mqx-cap-piece',
                    p.tone && `mqx-cap-piece--${p.tone}`,
                    locked && 'mqx-cap-piece--locked',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={locked}
                  onClick={locked ? undefined : () => onOpenSheet(p.id)}
                >
                  <span className="mqx-cap-piece__ico" aria-hidden>
                    {p.glyph}
                  </span>
                  <span className="mqx-cap-piece__title">{p.title}</span>
                  {note ? <small className="mqx-cap-piece__note">{note}</small> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {anyLocked && lockHint ? <p className="mqx-cap-acts__lock-hint">{lockHint}</p> : null}
    </div>
  );
}
