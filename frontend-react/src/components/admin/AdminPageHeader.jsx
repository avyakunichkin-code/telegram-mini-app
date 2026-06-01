/** Заголовок страницы админки: title + subtitle + actions slot. */
export function AdminPageHeader({ title, subtitle, children }) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__text">
        <h1 className="admin-page-header__title">{title}</h1>
        {subtitle ? <p className="mq-muted admin-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {children ? <div className="admin-page-header__actions">{children}</div> : null}
    </header>
  );
}
