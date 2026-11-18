import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTable } from './adminTable';
import { AdminFilterBar } from './ui/AdminFilterBar';
import {
  catalogColumnSortable,
  catalogColumnSortValue,
  formatCatalogCell,
} from './ui/adminCatalogTable';

function rowHighlightKey(row) {
  return String(row.template_key || row.key || row.id || '');
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

  const apiColumns = useMemo(() => data?.columns ?? [], [data]);

  const afterMutation = useCallback(
    (result) => {
      const hl = result.template_key || result.key;
      if (hl) {
        navigate(`/admin/catalogs/${catalogKey}?highlight=${encodeURIComponent(hl)}`);
      } else {
        load();
      }
    },
    [catalogKey, load, navigate],
  );

  const handleClone = useCallback(
    async (rowId) => {
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
    },
    [afterMutation, catalogKey, mutating],
  );

  const tableColumns = useMemo(() => {
    const dataCols = apiColumns.map((col) => ({
      key: col.key,
      label: col.label,
      render: (row) => formatCatalogCell(row[col.key]),
      sortable: catalogColumnSortable(col.key),
      sortValue: (row) => catalogColumnSortValue(row, col.key),
    }));
    dataCols.push({
      key: '_actions',
      label: 'Действия',
      render: (row) => (
        <div
          className="admin-catalog-list__actions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Link
            to={`/admin/catalogs/${catalogKey}/edit/${row.id}`}
            className="admin-inspector__link"
          >
            Редактировать
          </Link>
          <Button size="s" mode="plain" disabled={mutating} onClick={() => handleClone(row.id)}>
            Дублировать
          </Button>
        </div>
      ),
    });
    return dataCols;
  }, [apiColumns, catalogKey, handleClone, mutating]);

  const tableRows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => ({
        ...row,
        _key: String(row.id ?? row.key ?? row.template_key),
        _id: rowHighlightKey(row),
      })),
    [data?.rows],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchDraft.trim());
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

  const getRowRef = useCallback(
    (row) => (highlightKey && row._id === highlightKey ? highlightRef : undefined),
    [highlightKey],
  );

  const getRowClassName = useCallback(
    (row) =>
      highlightKey && row._id === highlightKey ? 'admin-catalog-list__row--highlight' : undefined,
    [highlightKey],
  );

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
          <Link
            to={`/admin/catalogs/${catalogKey}/new`}
            className="admin-inspector__link admin-catalog-list__create-link"
          >
            Создать…
          </Link>
          <Button size="s" mode="bezeled" onClick={handleCreateDraft} disabled={loading || mutating}>
            {mutating ? '…' : 'Пустой черновик'}
          </Button>
          <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
            Обновить
          </Button>
        </div>
      </AdminPageHeader>

      <AdminFilterBar
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        onSubmit={handleSearch}
        searchPlaceholder="Ключ или название…"
        showSearchReset={Boolean(query)}
        onSearchReset={() => {
          setSearchDraft('');
          setQuery('');
        }}
      >
        <label className="admin-filter-bar__check">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          <span>Только активные</span>
        </label>
      </AdminFilterBar>

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
          <AdminTable
            columns={tableColumns}
            rows={tableRows}
            highlightId={highlightKey || undefined}
            emptyText="Ничего не найдено"
            maxHeight="min(75vh, 680px)"
            virtualizeThreshold={60}
            getRowRef={getRowRef}
            getRowClassName={getRowClassName}
          />
        </section>
      ) : null}
    </div>
  );
}
