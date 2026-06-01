import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminPageHeader } from './AdminPageHeader';

export function AdminCatalogsHub() {
  const [catalogs, setCatalogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.catalogs();
      setCatalogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить справочники');
      setCatalogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-catalogs mq-section">
      <AdminPageHeader
        title="Справочники"
        subtitle="C0–C1 · просмотр, черновики и дублирование (события, стартеры, активы, долги)"
      >
        <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
          Обновить
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="admin-watchtower__loading">
          <Spinner size="m" />
        </div>
      ) : null}

      {error ? (
        <div className="mq-card admin-watchtower__error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="admin-catalogs__grid">
          {catalogs.map((cat) => (
            <Link
              key={cat.key}
              to={`/admin/catalogs/${cat.key}`}
              className="mq-card admin-catalogs__card"
            >
              <h2 className="admin-catalogs__card-title">{cat.title}</h2>
              <p className="mq-muted admin-catalogs__card-meta">
                {cat.columns?.length ?? 0} колонок в списке
              </p>
              <span className="admin-catalogs__card-cta">Открыть список →</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
