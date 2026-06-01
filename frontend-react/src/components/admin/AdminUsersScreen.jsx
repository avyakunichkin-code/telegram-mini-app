import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { useAdminUserColumns } from './adminPlayerColumns';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTable } from './adminTable';
import { AdminFilterBar } from './ui/AdminFilterBar';

export function AdminUsersScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const userColumns = useAdminUserColumns();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.users({ q: query, limit: 200 });
      setData(payload);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить игроков');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const users = useMemo(
    () =>
      (data?.users ?? []).map((u) => ({
        ...u,
        _key: `u-${u.id}`,
        _id: String(u.id),
      })),
    [data?.users],
  );

  return (
    <div className="admin-watchtower mq-section">
      <AdminPageHeader
        title="Игроки"
        subtitle={`Аккаунты User · показано ${users.length}${data ? ` из ${data.total}` : ''}`}
      >
        <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
          Обновить
        </Button>
      </AdminPageHeader>

      <AdminFilterBar
        searchLabel="Логин"
        searchPlaceholder="Имя пользователя…"
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(searchDraft.trim());
        }}
        showSearchReset={Boolean(query)}
        onSearchReset={() => {
          setSearchDraft('');
          setQuery('');
        }}
      />

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
        <section className="mq-card admin-watchtower__block">
          <AdminTable
            columns={userColumns}
            rows={users}
            maxHeight="min(78vh, 720px)"
            virtualizeThreshold={80}
            emptyText="Игроков не найдено"
          />
        </section>
      ) : null}
    </div>
  );
}
