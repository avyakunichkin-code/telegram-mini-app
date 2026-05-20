import { Fragment } from 'react';
import { IconChartUp, IconCoins, IconHome, IconMenu } from './icons/NavIcons';

const ITEMS = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'finance', label: 'Финансы', Icon: IconCoins },
  { id: 'analytics', label: 'Аналитика', Icon: IconChartUp },
  { id: 'menu', label: 'Меню', Icon: IconMenu },
];

export function BottomGameNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <nav className="bottom-nav bottom-nav--icons bottom-nav--unified" aria-label="Основные разделы">
      <div className="bottom-nav__track">
        {ITEMS.map(({ id, label, Icon }, index) => (
          <Fragment key={id}>
            {index > 0 ? <span className="bottom-nav__sep" aria-hidden /> : null}
            <button
              type="button"
              className={`bottom-nav__cell ${activeTab === id ? 'bottom-nav__cell--active' : ''}`}
              aria-label={label}
              aria-current={activeTab === id ? 'page' : undefined}
              title={label}
              disabled={lockTabs && id !== 'dashboard'}
              onClick={() => {
                if (lockTabs && id !== 'dashboard') return;
                setActiveTab(id);
              }}
            >
              <Icon size={23} />
            </button>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
