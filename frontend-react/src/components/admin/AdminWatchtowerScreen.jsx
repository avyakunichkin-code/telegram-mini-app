import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminNav } from './AdminNav';
import { AdminProfileInspectorPanel } from './AdminProfileInspectorPanel';
import { GuidanceBadge } from './AdminGuidanceBadge';

function formatDt(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return String(value);
  }
}

function OnboardingFunnel({ funnel }) {
  if (!funnel) return null;
  return (
    <section className="mq-card admin-watchtower__block admin-watchtower__funnel">
      <h2 className="admin-watchtower__block-title">O2 · Progressive Guidance</h2>
      <div className="admin-watchtower__kpi-row">
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Стартов игр</span>
          <strong>{funnel.started_profiles}</strong>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">В guidance</span>
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
              <th>Beat</th>
              <th>Сейчас (user)</th>
              <th>Дошли (progress)</th>
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
        «Сейчас» — пользователи с незавершённым guidance на этом beat. «Дошли» — beat в
        guidance_progress_json.
      </p>
    </section>
  );
}

function MetricsSummary({ summary }) {
  if (!summary) return null;
  const days = summary.window_days ?? 7;
  return (
    <section className="mq-card admin-watchtower__block admin-watchtower__summary">
      <h2 className="admin-watchtower__block-title">Сводка · {days} дн.</h2>
      <div className="admin-watchtower__kpi-row admin-watchtower__kpi-row--summary">
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Пользователи</span>
          <strong>{summary.users_total}</strong>
          <span className="admin-watchtower__kpi-sub">+{summary.users_recent} за {days}д</span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Профили актив.</span>
          <strong>{summary.profiles_active}</strong>
          <span className="admin-watchtower__kpi-sub">всего {summary.profiles_total}</span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Guidance</span>
          <strong>{summary.guidance_in_progress}</strong>
          <span className="admin-watchtower__kpi-sub">
            ✓ {summary.guidance_completed_total} (+{summary.guidance_completed_recent})
          </span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Победы</span>
          <strong>{summary.wins_total}</strong>
          <span className="admin-watchtower__kpi-sub">+{summary.wins_recent} за {days}д</span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Ср. период</span>
          <strong>{summary.avg_period_index_active}</strong>
          <span className="admin-watchtower__kpi-sub">
            стартов +{summary.game_started_recent}
          </span>
        </div>
      </div>
    </section>
  );
}

function Table({ columns, rows, highlightId, onRowClick }) {
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
              className={[
                highlightId != null && row._id === highlightId
                  ? 'admin-watchtower__row--highlight'
                  : null,
                onRowClick ? 'admin-watchtower__row--clickable' : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
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
  const [searchParams, setSearchParams] = useSearchParams();
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
        key: 'guidance',
        label: 'Guidance',
        render: (r) => (
          <>
            <GuidanceBadge completed={r.guidance_completed} />
            {r.guidance_current_beat ? (
              <span className="admin-watchtower__step-tag">{r.guidance_current_beat}</span>
            ) : null}
          </>
        ),
      },
      { key: 'cash', label: 'Cash', render: (r) => `${r.cash_balance} ₽` },
      {
        key: 'stuck',
        label: 'Застрял',
        render: (r) =>
          r.stuck_kind === 'onboarding_stuck' ? (
            <span className="admin-watchtower__badge admin-watchtower__badge--stuck">
              онбординг
            </span>
          ) : r.stuck_kind === 'player_stuck' ? (
            <span className="admin-watchtower__badge admin-watchtower__badge--stuck">игра</span>
          ) : (
            '—'
          ),
      },
      { key: 'active', label: 'Активен', render: (r) => (r.is_active ? 'да' : 'нет') },
    ],
    [],
  );

  const notificationColumns = useMemo(
    () => [
      { key: 'when', label: 'Когда', render: (r) => formatDt(r.created_at) },
      { key: 'kind', label: 'Тип', render: (r) => r.kind_label || r.kind },
      {
        key: 'summary',
        label: 'Событие',
        render: (r) => (
          <span className="admin-watchtower__alert-summary">
            {(r.summary || r.kind).split('\n')[0]}
          </span>
        ),
      },
      { key: 'profile', label: 'Профиль', render: (r) => r.game_profile_id ?? '—' },
      { key: 'tg', label: 'В TG', render: (r) => (r.telegram_sent ? '✓' : '—') },
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

  const openProfile = useCallback(
    (row) => {
      const next = new URLSearchParams(searchParams);
      next.set('profile', String(row.id));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="admin-watchtower mq-section">
      <AdminNav />
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

      <AdminProfileInspectorPanel />

      {!loading && !error && data ? (
        <>
          <MetricsSummary summary={data.metrics_summary} />
          <OnboardingFunnel funnel={data.onboarding_funnel} />

          <div className="admin-watchtower__panels admin-watchtower__panels--split">
            <section className="mq-card admin-watchtower__block">
              <h2 className="admin-watchtower__block-title">Пользователи</h2>
              <Table columns={userColumns} rows={users} highlightId={highlightUser} />
            </section>

            <section className="mq-card admin-watchtower__block">
              <h2 className="admin-watchtower__block-title">Профили</h2>
              <Table
                columns={profileColumns}
                rows={profiles}
                highlightId={highlightProfile}
                onRowClick={openProfile}
              />
            </section>
          </div>

          <section className="mq-card admin-watchtower__block">
            <h2 className="admin-watchtower__block-title">Журнал алертов</h2>
            <Table columns={notificationColumns} rows={notifications} />
          </section>
        </>
      ) : null}
    </div>
  );
}
