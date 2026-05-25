import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Watchtower', end: true },
  { to: '/admin/catalogs', label: 'Справочники', end: false },
];

export function AdminNav() {
  return (
    <nav className="mq-admin-nav" aria-label="Разделы админки">
      {LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `mq-admin-nav__link${isActive ? ' mq-admin-nav__link--active' : ''}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
