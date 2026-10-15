import { useRef } from 'react';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { lifeIncomePerTurn, lifeStartConditions } from '../utils/pregameDisplay';

/**
 * Выбор жизни ★ BG-2: карточки персонажей как выбор фишки перед партией.
 * Портрет (pick), роль, доход за ход, стартовые условия; выбранная — фиолетовая рамка.
 * Выбор не стартует игру — старт по кнопке «Начать за …» на экране.
 * Канон: design-lab/board-game/screens-round/ (Выбор жизни), design-lab/pre-game-shell/APPROVED.md.
 */
export function MqxStarterScenarioPicker({ templates, value, onChange, disabled = false, labelledById, label }) {
  const refs = useRef([]);
  const list = templates || [];
  const selectedIndex = list.findIndex((t) => t.template_key === value);

  const select = (index) => {
    const t = list[index];
    if (!t || disabled) return;
    onChange?.(t.template_key);
    refs.current[index]?.focus();
  };

  const onKeyDown = (ev, index) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
    if (!step || list.length === 0) return;
    ev.preventDefault();
    select((index + step + list.length) % list.length);
  };

  return (
    <div
      className="mqx-pg-life"
      role="radiogroup"
      aria-labelledby={labelledById}
      aria-label={labelledById ? undefined : label}
      aria-disabled={disabled || undefined}
    >
      {list.map((t, index) => {
        const sel = index === selectedIndex;
        const income = lifeIncomePerTurn(t.highlights);
        const conditions = lifeStartConditions(t);
        const focusable = sel || (selectedIndex < 0 && index === 0);
        return (
          <button
            key={t.template_key}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={sel}
            tabIndex={focusable ? 0 : -1}
            disabled={disabled}
            className={['mqx-bg-btn', 'mqx-pg-person', sel ? 'mqx-pg-person--on' : ''].filter(Boolean).join(' ')}
            onClick={() => select(index)}
            onKeyDown={(ev) => onKeyDown(ev, index)}
          >
            <PersonaPortrait templateKey={t.template_key} size="pick" className="mqx-pg-person__portrait" />
            <span className="mqx-pg-person__body">
              <b className="mqx-pg-person__title">{t.title}</b>
              {income ? <span className="mqx-pg-person__money">{income}</span> : null}
              {conditions ? <small className="mqx-pg-person__note">{conditions}</small> : null}
            </span>
            <span className="mqx-pg-person__check" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
