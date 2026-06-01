import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminPageHeader } from './AdminPageHeader';

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

export function AdminCatalogListScreen() {
  const { catalogKey } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightKey = searchParams.get('highlight') || '';
  const highlightRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [mutating, setMutating] = useState(false);

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

  useEffect(() => {
    if (highlightKey) load();
  }, [highlightKey, load]);

  useEffect(() => {
    if (!highlightKey || !data?.rows?.length) return;
    const row = data.rows.find(
      (r) =>
        String(r.template_key || r.key || '') === highlightKey ||
        String(r.id) === highlightKey,
    );
    if (row && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [highlightKey, data?.rows]);

  const columns = useMemo(() => data?.columns ?? [], [data]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchDraft.trim());
  };

  const rowHighlightKey = (row) => String(row.template_key || row.key || row.id || '');

  const afterMutation = (result) => {
    const hl = result.template_key || result.key;
    if (hl) {
      navigate(`/admin/catalogs/${catalogKey}?highlight=${encodeURIComponent(hl)}`);
    } else {
      load();
    }
  };

  const handleCreateDraft = async () => {
    if (!catalogKey || mutating) return;
    setMutating(true);
    setError(null);
    try {
      const result = await adminApi.catalogCreate(catalogKey, {});
      afterMutation(result);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось создать черновик');
    } finally {
      setMutating(false);
    }
  };

  const handleClone = async (rowId) => {
    if (!catalogKey || mutating) return;
    setMutating(true);
    setError(null);
    try {
      const result = await adminApi.catalogClone(catalogKey, rowId);
      afterMutation(result);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось дублировать');
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="admin-catalog-list mq-section">
      <AdminPageHeader
        title={data?.title ?? catalogKey}
        subtitle={
          data
            ? `C1 · черновики is_active=0 · ${data.rows?.length ?? 0} из ${data.total}${
                data.total > data.limit ? ` (лимит ${data.limit})` : ''
              }`
            : 'Загрузка…'
        }
      >
        <div className="admin-watchtower__actions">
          <Button size="s" mode="bezeled" onClick={handleCreateDraft} disabled={loading || mutating}>
            {mutating ? '…' : 'Пустой черновик'}
          </Button>
          <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
            Обновить
          </Button>
        </div>
      </AdminPageHeader>

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
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const rowKey = rowHighlightKey(row);
                    const isHighlight = highlightKey && rowKey === highlightKey;
                    return (
                      <tr
                        key={row.id ?? row.key ?? row.template_key}
                        ref={isHighlight ? highlightRef : undefined}
                        className={
                          isHighlight ? 'admin-catalog-list__row--highlight' : undefined
                        }
                      >
                        {columns.map((col) => (
                          <td key={col.key}>{formatCell(row[col.key])}</td>
                        ))}
                        <td className="admin-catalog-list__actions">
                          <Link
                            to={`/admin/catalogs/${catalogKey}/edit/${row.id}`}
                            className="admin-inspector__link"
                          >
                            Редактировать
                          </Link>
                          <Button
                            size="s"
                            mode="plain"
                            disabled={mutating}
                            onClick={() => handleClone(row.id)}
                          >
                            Дублировать
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
