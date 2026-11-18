const MODES = [
  { id: 'details', label: 'Детали' },
  { id: 'actions', label: 'Действия' },
];

/** Переключатель «Детали | Действия» ★ BG-2: активный режим — фиолетовая фишка. */
export function MqxCapitalPageModeSeg({ mode = 'details', onModeChange }) {
  return (
    <div className="mqx-cap-seg" role="tablist" aria-label="Раздел капитала">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            id={`capital-tab-${m.id}`}
            aria-selected={active}
            aria-controls={`capital-panel-${m.id}`}
            className={`mqx-bg-btn mqx-cap-seg__btn${active ? ' is-active' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
