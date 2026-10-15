/**
 * Карточка собственности ★ BG-2 (design-lab/board-game/screens-round, «Капитал · Детали»).
 * Цветная полоса говорит, что это: invest — золото, property — изумруд,
 * insure — фиолетовый, debt — красный (только долги).
 */
export function CapitalLot({ tone, title, meta, locked = false, children }) {
  return (
    <section
      className={['mqx-cap-lot', `mqx-cap-lot--${tone}`, locked && 'mqx-cap-lot--locked']
        .filter(Boolean)
        .join(' ')}
      aria-label={title}
    >
      <div className="mqx-cap-lot__band" aria-hidden />
      <div className="mqx-cap-lot__head">
        <h2 className="mqx-cap-lot__title">{title}</h2>
        {meta ? <span className="mqx-cap-lot__meta">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** Строка позиции: название, сумма справа, пояснение и действия под ними. */
export function CapitalLotRow({ title, value, note, actions }) {
  return (
    <div className="mqx-cap-lot-row">
      <span className="mqx-cap-lot-row__title">{title}</span>
      <b className="mqx-cap-lot-row__val">{value}</b>
      {note ? <span className="mqx-cap-lot-row__note">{note}</span> : null}
      {actions ? <span className="mqx-cap-lot-row__acts">{actions}</span> : null}
    </div>
  );
}

/** Текстовое действие в строке («Закрыть», «Продать», «Погасить»). */
export function CapitalLotAction({ children, onClick, disabled = false, ariaLabel }) {
  return (
    <button
      type="button"
      className="mqx-bg-btn mqx-cap-lot-act"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

/** Пусто / закрыто: одна спокойная строка текста. */
export function CapitalLotNote({ children }) {
  return <div className="mqx-cap-lot-note">{children}</div>;
}
