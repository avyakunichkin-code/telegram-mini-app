import { useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@telegram-apps/telegram-ui';
import { AdminProfileInspectorPanel } from './AdminProfileInspectorPanel';
import { AdminDrawer } from './ui/AdminDrawer';

const CATALOG_LINKS = [
  { key: 'liabilities', label: 'Долги' },
  { key: 'assets', label: 'Активы' },
  { key: 'starters', label: 'Стартеры' },
  { key: 'events', label: 'События' },
];

const WATCHTOWER_TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'alerts', label: 'Алерты' },
  { id: 'feedback', label: 'Отзывы' },
  { id: 'guidance', label: 'Guidance' },
];

function SidebarLink({ to, end, children, className }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'mq-admin-sidebar__link',
          className,
          isActive ? 'mq-admin-sidebar__link--active' : null,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

function WatchtowerTabLink({ tabId, label }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isWatchtower = location.pathname === '/admin' || location.pathname === '/admin/';
  const current = isWatchtower ? searchParams.get('tab') || 'overview' : '';
  const active = isWatchtower && current === tabId;
  const next = new URLSearchParams(searchParams);
  next.set('tab', tabId);
  const profile = searchParams.get('profile');
  if (profile) next.set('profile', profile);
  const user = searchParams.get('user');
  if (user) next.set('user', user);

  return (
    <NavLink
      to={{ pathname: '/admin', search: `?${next.toString()}` }}
      className={`mq-admin-sidebar__sublink${active ? ' mq-admin-sidebar__sublink--active' : ''}`}
    >
      {label}
    </NavLink>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProfileInspector = Boolean(searchParams.get('profile'));

  const closeInspector = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('profile');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const catalogMatch = location.pathname.match(/^\/admin\/catalogs\/([^/]+)/);
  const catalogKey = catalogMatch?.[1];
  const isEditor = location.pathname.includes('/edit/');

  return (
    <div className="mq-admin-layout">
      <aside className="mq-admin-sidebar" aria-label="Навигация админки">
        <div className="mq-admin-sidebar__brand">
          <span className="mq-admin-sidebar__logo">ТВОЙ ХОД</span>
          <span className="mq-admin-sidebar__tag">Ops</span>
        </div>

        <nav className="mq-admin-sidebar__section">
          <span className="mq-admin-sidebar__section-title">Мониторинг</span>
          <SidebarLink to="/admin" end>
            Watchtower
          </SidebarLink>
          <div className="mq-admin-sidebar__sub">
            {WATCHTOWER_TABS.map((t) => (
              <WatchtowerTabLink key={t.id} tabId={t.id} label={t.label} />
            ))}
            <NavLink to="/admin/users" className="mq-admin-sidebar__sublink">
              Игроки
            </NavLink>
            <NavLink to="/admin/profiles" className="mq-admin-sidebar__sublink">
              Профили
            </NavLink>
          </div>
        </nav>

        <nav className="mq-admin-sidebar__section">
          <span className="mq-admin-sidebar__section-title">Контент</span>
          <SidebarLink to="/admin/catalogs">Справочники</SidebarLink>
          <div className="mq-admin-sidebar__sub">
            {CATALOG_LINKS.map((c) => (
              <NavLink
                key={c.key}
                to={`/admin/catalogs/${c.key}`}
                className={({ isActive }) =>
                  [
                    'mq-admin-sidebar__sublink',
                    isActive && !isEditor && catalogKey === c.key
                      ? 'mq-admin-sidebar__sublink--active'
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="mq-admin-sidebar__footer">
          <Button
            size="s"
            mode="plain"
            className="mq-admin-sidebar__exit"
            onClick={() => navigate('/', { replace: true })}
          >
            ← К игре
          </Button>
        </div>
      </aside>

      <div className="mq-admin-layout__main">
        <div className="mq-admin-layout__page">
          <Outlet />
        </div>
        <AdminDrawer open={hasProfileInspector} onClose={closeInspector}>
          <AdminProfileInspectorPanel onClose={closeInspector} />
        </AdminDrawer>
      </div>
    </div>
  );
}
