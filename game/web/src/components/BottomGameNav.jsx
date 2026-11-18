const ITEMS = [
  { id: 'dashboard', label: 'Главная' },
  { id: 'finance', label: 'Капитал' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'menu', label: 'Меню' },
];

/** Таббар ★ BG-2: светлая поверхность через токены в обеих темах, активная вкладка — фиолетовая фишка. */
export function BottomGameNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <nav className={`bottom-nav bottom-nav--icons bottom-nav--unified${activeTab === 'dashboard' ? ' bottom-nav--dashboard' : ['menu', 'finance', 'analytics'].includes(activeTab) ? ' bottom-nav--menu' : ''}`} aria-label="Основные разделы">
      <div className="bottom-nav__track" role="tablist" aria-label="Вкладки игры">
        {ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`bottom-nav__cell ${activeTab === id ? 'bottom-nav__cell--active' : ''}`}
            aria-label={label}
            aria-selected={activeTab === id}
            aria-current={activeTab === id ? 'page' : undefined}
            title={label}
            disabled={lockTabs && id !== 'dashboard'}
            onClick={() => {
              if (lockTabs && id !== 'dashboard') return;
              setActiveTab(id);
            }}
          >
            <span className="bottom-nav__cell-inner">
              <span className={`bottom-nav__art bottom-nav__art--${id}`} aria-hidden="true" />
              <span className="bottom-nav__label">{label}</span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
