import { Fragment } from 'react';
import { IconChartUp, IconCoins, IconHome, IconMenu } from './icons/NavIcons';

const ITEMS = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'finance', label: 'Капитал', Icon: IconCoins },
  { id: 'analytics', label: 'Аналитика', Icon: IconChartUp },
  { id: 'menu', label: 'Меню', Icon: IconMenu },
];

export function BottomGameNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <nav className="bottom-nav bottom-nav--icons bottom-nav--unified" aria-label="Основные разделы">
      <div className="bottom-nav__track" role="tablist" aria-label="Вкладки игры">
        {ITEMS.map(({ id, label, Icon }, index) => (
          <Fragment key={id}>
            {index > 0 ? <span className="bottom-nav__sep" aria-hidden /> : null}
            <button
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
                <Icon size={22} aria-hidden />
                <span className="bottom-nav__label">{label}</span>
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
