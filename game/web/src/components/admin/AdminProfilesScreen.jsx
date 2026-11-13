import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { PROFILE_FILTERS, useAdminProfileColumns } from './adminPlayerColumns';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTable } from './adminTable';
import { AdminFilterBar } from './ui/AdminFilterBar';

export function AdminProfilesScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get('user_id');
  const userId = userIdParam ? Number(userIdParam) : null;
  const userLabel = searchParams.get('user_label') || '';
  const profileFilter = searchParams.get('profile_filter') || '';
  const profileSearch = searchParams.get('q') || '';
  const highlightProfile = searchParams.get('profile');

  const [data, setData] = useState(null);
  const [searchDraft, setSearchDraft] = useState(profileSearch);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileColumns = useAdminProfileColumns({ searchParams, setSearchParams });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.profiles({
        user_id: userId || undefined,
        q: profileSearch || undefined,
        profile_filter: profileFilter || undefined,
        limit: 200,
      });
      setData(payload);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить профили');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, profileFilter, profileSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearchDraft(profileSearch);
  }, [profileSearch]);

  const applyProfileSearch = useCallback(
    (e) => {
      e?.preventDefault?.();
      const next = new URLSearchParams(searchParams);
      const q = searchDraft.trim();
      if (q) next.set('q', q);
      else next.delete('q');
      setSearchParams(next, { replace: true });
    },
    [searchDraft, searchParams, setSearchParams],
  );

  const setProfileFilter = useCallback(
    (nextFilter) => {
      const next = new URLSearchParams(searchParams);
      if (nextFilter) next.set('profile_filter', nextFilter);
      else next.delete('profile_filter');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openProfileId = useCallback(
    (profileId) => {
      const next = new URLSearchParams(searchParams);
      next.set('profile', String(profileId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openProfile = useCallback((row) => openProfileId(row.id), [openProfileId]);

  const profiles = useMemo(
    () =>
      (data?.profiles ?? []).map((p) => ({
        ...p,
        _key: `p-${p.id}`,
        _id: String(p.id),
      })),
    [data?.profiles],
  );

  const clearUserFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('user_id');
    next.delete('user_label');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="admin-watchtower mq-section">
      <AdminPageHeader
        title="Профили"
        subtitle={
          userId
            ? `Фильтр: ${userLabel || `user #${userId}`} · ${profiles.length} профилей`
            : `Игровые сохранения · ${profiles.length}${data ? ` / ${data.total}` : ''}`
        }
      >
        <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
          Обновить
        </Button>
      </AdminPageHeader>

      {userId ? (
        <p className="admin-profiles-user-banner mq-card">
          Профили игрока{' '}
          <strong>{userLabel || `#${userId}`}</strong>
          {' · '}
          <button type="button" className="admin-inspector__link" onClick={clearUserFilter}>
            Показать все профили
          </button>
          {' · '}
          <Link to="/admin/users" className="admin-inspector__link">
            К списку игроков
          </Link>
        </p>
      ) : null}

      <AdminFilterBar
        searchLabel="Профили"
        searchPlaceholder="Логин или имя профиля…"
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        onSubmit={applyProfileSearch}
        showSearchReset={Boolean(profileSearch)}
        onSearchReset={() => {
          setSearchDraft('');
          const next = new URLSearchParams(searchParams);
          next.delete('q');
          setSearchParams(next, { replace: true });
        }}
        chips={PROFILE_FILTERS}
        activeChipId={profileFilter}
        onChipSelect={setProfileFilter}
        chipAriaLabel="Фильтр профилей"
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
            columns={profileColumns}
            rows={profiles}
            highlightId={highlightProfile}
            onRowClick={openProfile}
            maxHeight="min(78vh, 720px)"
            virtualizeThreshold={80}
            emptyText="Профилей не найдено"
          />
        </section>
      ) : null}
    </div>
  );
}
