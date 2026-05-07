import { IconChartUp, IconCoins, IconHome, IconMenu } from './icons/NavIcons';

const ITEMS = [
  { id: 'dashboard', label: 'Главная', Icon: IconHome },
  { id: 'finance', label: 'Финансы', Icon: IconCoins },
  { id: 'analytics', label: 'Аналитика', Icon: IconChartUp },
  { id: 'menu', label: 'Меню', Icon: IconMenu },
];

export function BottomGameNav({ activeTab, setActiveTab }) {
  return (
    <nav
      className="bottom-nav bottom-nav--icons"
      aria-label="Основные разделы"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
    >
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`tma-nav-icon-btn ${activeTab === id ? 'tma-nav-icon-btn--active' : ''}`}
          aria-label={label}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => setActiveTab(id)}
        >
          <Icon size={23} />
        </button>
      ))}
    </nav>
  );
}
