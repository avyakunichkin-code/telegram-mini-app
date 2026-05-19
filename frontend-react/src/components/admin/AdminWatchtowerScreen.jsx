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

function OnboardingBadge({ state }) {
  const s = state || 'brief_done';
  const draft = s === 'draft' || s === 'started';
  return (
    <span className={`admin-watchtower__badge ${draft ? 'admin-watchtower__badge--draft' : 'admin-watchtower__badge--done'}`}>
      {draft ? 'coach' : 'готово'}
    </span>
  );
}

function OnboardingFunnel({ funnel }) {
  if (!funnel) return null;
  return (
    <section className="mq-card admin-watchtower__block admin-watchtower__funnel">
      <h2 className="admin-watchtower__block-title">Воронка онбординга</h2>
      <div className="admin-watchtower__kpi-row">
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Стартов</span>
          <strong>{funnel.started_profiles}</strong>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">В coach</span>
          <strong>{funnel.draft_profiles}</strong>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Завершили</span>
          <strong>{funnel.brief_done_profiles}</strong>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Конверсия</span>
          <strong>{funnel.completion_rate_pct}%</strong>
        </div>
      </div>
      <div className="admin-watchtower__table-wrap">
        <table className="admin-watchtower__table admin-watchtower__table--funnel">
          <thead>
            <tr>
              <th>Шаг</th>
              <th>Сейчас (draft)</th>
              <th>Дошли (лог)</th>
            </tr>
          </thead>
          <tbody>
            {(funnel.steps ?? []).map((row) => (
              <tr key={row.step}>
                <td>{row.label}</td>
                <td>{row.current_count}</td>
                <td>{row.reached_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mq-muted admin-watchtower__funnel-hint">
        «Сейчас» — профили в coach на шаге. «Дошли» — уникальные profile_id в журнале (без Telegram на шагах).
      </p>
    </section>
  );
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
      {
        key: 'onboarding',
        label: 'Coach',
        render: (r) => (
          <>
            <OnboardingBadge state={r.onboarding_state} />
            <span className="admin-watchtower__step-tag">{r.onboarding_step}</span>
          </>
        ),
      },
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
          <OnboardingFunnel funnel={data.onboarding_funnel} />

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
