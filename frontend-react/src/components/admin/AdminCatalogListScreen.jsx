import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminNav } from './AdminNav';

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

export function AdminCatalogListScreen() {
  const { catalogKey } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');

  const load = useCallback(async () => {
    if (!catalogKey) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.catalogRows(catalogKey, {
        q: query,
        active_only: activeOnly,
      });
      setData(payload);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить список');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [catalogKey, query, activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => data?.columns ?? [], [data]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchDraft.trim());
  };

  return (
    <div className="admin-catalog-list mq-section">
      <AdminNav />
      <header className="admin-watchtower__header">
        <div>
          <p className="admin-catalog-list__back">
            <Link to="/admin/catalogs">← Справочники</Link>
          </p>
          <h1 className="mq-section__title">{data?.title ?? catalogKey}</h1>
          <p className="mq-muted mq-section__subtitle">
            {data ? (
              <>
                Показано {data.rows?.length ?? 0} из {data.total}
                {data.total > data.limit ? ` (лимит ${data.limit})` : null}
              </>
            ) : (
              'Загрузка…'
            )}
          </p>
        </div>
        <div className="admin-watchtower__actions">
          <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
            Обновить
          </Button>
        </div>
      </header>

      <form className="admin-catalog-list__filters mq-card" onSubmit={handleSearch}>
        <label className="admin-catalog-list__search">
          <span className="admin-catalog-list__search-label">Поиск</span>
          <input
            className="mq-field__input"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Ключ или название…"
          />
        </label>
        <label className="admin-catalog-list__check">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          <span>Только активные</span>
        </label>
        <Button size="s" type="submit">
          Найти
        </Button>
      </form>

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

      {!loading && !error && data ? (
        <section className="mq-card admin-watchtower__block">
          {data.rows?.length ? (
            <div className="admin-watchtower__table-wrap">
              <table className="admin-watchtower__table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id ?? row.key ?? row.template_key}>
                      {columns.map((col) => (
                        <td key={col.key}>{formatCell(row[col.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mq-muted">Ничего не найдено</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
