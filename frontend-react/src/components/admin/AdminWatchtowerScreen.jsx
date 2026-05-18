import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';

function formatDt(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return String(value);
  }
}

function Table({ columns, rows, highlightId }) {
  if (!rows.length) {
    return <p className="mq-muted">Пока пусто</p>;
  }
  return (
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
          {rows.map((row) => (
            <tr
              key={row._key}
              className={
                highlightId != null && row._id === highlightId
                  ? 'admin-watchtower__row--highlight'
                  : undefined
              }
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminWatchtowerScreen({ onBack }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightProfile = searchParams.get('profile');
  const highlightUser = searchParams.get('user');

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.watchtower();
      setData(payload);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить Watchtower');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id },
      { key: 'username', label: 'Логин', render: (r) => r.username },
      { key: 'telegram', label: 'TG', render: (r) => r.telegram_id ?? '—' },
      { key: 'profiles', label: 'Профили', render: (r) => r.profiles_count },
      { key: 'created', label: 'Создан', render: (r) => formatDt(r.created_at) },
    ],
    [],
  );

  const profileColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id },
      { key: 'user', label: 'User', render: (r) => r.username },
      { key: 'name', label: 'Имя', render: (r) => r.name },
      { key: 'template', label: 'Шаблон', render: (r) => r.starter_template_key || '—' },
      { key: 'period', label: 'Период', render: (r) => r.period_index },
      { key: 'cash', label: 'Cash', render: (r) => `${r.cash_balance} ₽` },
      { key: 'active', label: 'Активен', render: (r) => (r.is_active ? 'да' : 'нет') },
    ],
    [],
  );

  const notificationColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id },
      { key: 'kind', label: 'Тип', render: (r) => r.kind },
      { key: 'profile', label: 'Профиль', render: (r) => r.game_profile_id ?? '—' },
      { key: 'tg', label: 'TG', render: (r) => (r.telegram_sent ? '✓' : '—') },
      { key: 'when', label: 'Когда', render: (r) => formatDt(r.created_at) },
    ],
    [],
  );

  const users = (data?.users ?? []).map((u) => ({ ...u, _key: `u-${u.id}`, _id: String(u.id) }));
  const profiles = (data?.profiles ?? []).map((p) => ({
    ...p,
    _key: `p-${p.id}`,
    _id: String(p.id),
  }));
  const notifications = (data?.notifications ?? []).map((n) => ({
    ...n,
    _key: `n-${n.id}`,
    _id: String(n.id),
  }));

  return (
    <div className="admin-watchtower mq-section">
      <header className="admin-watchtower__header">
        <div>
          <h1 className="mq-section__title">Watchtower</h1>
          <p className="mq-muted mq-section__subtitle">
            MVP 1.2 · ops-алерты и последние игроки (только admin)
          </p>
        </div>
        <div className="admin-watchtower__actions">
          <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
            Обновить
          </Button>
          <Button
            size="s"
            mode="plain"
            onClick={() => {
              if (onBack) onBack();
              else navigate('/', { replace: true });
            }}
          >
            К игре
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="admin-watchtower__loading">
          <Spinner size="m" />
        </div>
      ) : null}

      {error ? (
        <div className="mq-card admin-watchtower__error" role="alert">
          <p>{error}</p>
          <p className="mq-muted">
            Проверьте ADMIN_USER_IDS на сервере и что вы вошли под этим аккаунтом.
          </p>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <section className="mq-card admin-watchtower__block">
            <h2 className="admin-watchtower__block-title">Пользователи</h2>
            <Table columns={userColumns} rows={users} highlightId={highlightUser} />
          </section>

          <section className="mq-card admin-watchtower__block">
            <h2 className="admin-watchtower__block-title">Профили</h2>
            <Table columns={profileColumns} rows={profiles} highlightId={highlightProfile} />
          </section>

          <section className="mq-card admin-watchtower__block">
            <h2 className="admin-watchtower__block-title">Журнал алертов</h2>
            <Table columns={notificationColumns} rows={notifications} />
          </section>
        </>
      ) : null}
    </div>
  );
}
