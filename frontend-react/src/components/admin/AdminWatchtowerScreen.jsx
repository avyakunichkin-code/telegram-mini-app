import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminAttentionQueue } from './AdminAttentionQueue';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminTable, formatAdminDt } from './adminTable';
import { GuidanceBadge } from './AdminGuidanceBadge';
import { notificationProfileId } from './adminUtils';

const PROFILE_FILTERS = [
  { id: '', label: 'Все' },
  { id: 'stuck', label: 'Застрял' },
  { id: 'guidance_draft', label: 'Guidance draft' },
  { id: 'defeat', label: 'Поражение' },
  { id: 'victory', label: 'Победа' },
];

const WATCHTOWER_TAB_LABELS = {
  overview: 'Обзор',
  players: 'Игроки',
  alerts: 'Алерты',
  feedback: 'Отзывы',
  guidance: 'Guidance',
};

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
          <span className="admin-watchtower__kpi-label">Поражения</span>
          <strong>{summary.defeats_total ?? 0}</strong>
          <span className="admin-watchtower__kpi-sub">
            +{summary.defeats_recent ?? 0} за {days}д
          </span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Отзывы</span>
          <strong>{summary.run_feedback_recent ?? 0}</strong>
          <span className="admin-watchtower__kpi-sub">за {days}д</span>
        </div>
        <div className="admin-watchtower__kpi">
          <span className="admin-watchtower__kpi-label">Период ≥3</span>
          <strong>{summary.profiles_period_3_plus_active ?? 0}</strong>
          <span className="admin-watchtower__kpi-sub">
            всего {summary.profiles_period_3_plus_total ?? 0}
          </span>
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

export function AdminWatchtowerScreen({ onBack }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const highlightProfile = searchParams.get('profile');
  const highlightUser = searchParams.get('user');
  const profileFilter = searchParams.get('profile_filter') || '';
  const profileSearch = searchParams.get('q') || '';

  const [data, setData] = useState(null);
  const [searchDraft, setSearchDraft] = useState(profileSearch);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.watchtower({
        profile_limit: 80,
        profile_filter: profileFilter || undefined,
        q: profileSearch || undefined,
      });
      setData(payload);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить Watchtower');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [profileFilter, profileSearch]);

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

  const userColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id },
      { key: 'username', label: 'Логин', render: (r) => r.username },
      { key: 'telegram', label: 'TG', render: (r) => r.telegram_id ?? '—' },
      { key: 'profiles', label: 'Профили', render: (r) => r.profiles_count },
      { key: 'created', label: 'Создан', render: (r) => formatAdminDt(r.created_at) },
    ],
    [],
  );

  const profileColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id },
      { key: 'user', label: 'User', render: (r) => r.username },
      { key: 'name', label: 'Имя', render: (r) => r.name },
      {
        key: 'template',
        label: 'Шаблон',
        render: (r) =>
          r.starter_template_key ? (
            <Link
              to={`/admin/catalogs/starters?highlight=${encodeURIComponent(r.starter_template_key)}`}
              className="admin-inspector__link"
              onClick={(e) => e.stopPropagation()}
            >
              {r.starter_template_key}
            </Link>
          ) : (
            '—'
          ),
      },
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
        key: 'outcome',
        label: 'Исход',
        render: (r) =>
          r.run_outcome ? (
            <span
              className={
                r.run_outcome === 'victory'
                  ? 'admin-watchtower__badge admin-watchtower__badge--win'
                  : 'admin-watchtower__badge admin-watchtower__badge--loss'
              }
            >
              {r.run_outcome_label || r.run_outcome}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'archived',
        label: 'Архив',
        render: (r) =>
          r.is_archived ? (
            <span className="admin-watchtower__badge admin-watchtower__badge--archived">да</span>
          ) : (
            '—'
          ),
      },
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
      { key: 'when', label: 'Когда', render: (r) => formatAdminDt(r.created_at) },
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
      {
        key: 'profile',
        label: 'Профиль',
        render: (r) => {
          const pid = notificationProfileId(r);
          return pid ? (
            <button
              type="button"
              className="admin-inspector__link"
              onClick={(e) => {
                e.stopPropagation();
                const next = new URLSearchParams(searchParams);
                next.set('profile', String(pid));
                setSearchParams(next, { replace: true });
              }}
            >
              #{pid}
            </button>
          ) : (
            '—'
          );
        },
      },
      { key: 'tg', label: 'В TG', render: (r) => (r.telegram_sent ? '✓' : '—') },
    ],
    [searchParams, setSearchParams],
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

  const runFeedbackColumns = useMemo(
    () => [
      { key: 'when', label: 'Когда', render: (r) => formatAdminDt(r.created_at) },
      { key: 'user', label: 'Игрок', render: (r) => `${r.username} (#${r.user_id})` },
      {
        key: 'profile',
        label: 'Профиль',
        render: (r) => `${r.profile_name} (#${r.game_profile_id})`,
      },
      {
        key: 'outcome',
        label: 'Исход',
        render: (r) => (
          <span
            className={
              r.outcome === 'victory'
                ? 'admin-watchtower__badge admin-watchtower__badge--win'
                : 'admin-watchtower__badge admin-watchtower__badge--loss'
            }
          >
            {r.outcome_label || r.outcome}
          </span>
        ),
      },
      { key: 'period', label: 'Период', render: (r) => r.period_index },
      { key: 'template', label: 'Шаблон', render: (r) => r.template_key || '—' },
      {
        key: 'comment',
        label: 'Комментарий',
        render: (r) => (
          <span className="admin-watchtower__feedback-comment" title={r.comment}>
            {r.comment_preview || r.comment || '—'}
          </span>
        ),
      },
    ],
    [],
  );

  const runFeedback = (data?.run_feedback ?? []).map((r) => ({
    ...r,
    _key: `rf-${r.id}`,
    _id: String(r.id),
  }));

  const openProfileId = useCallback(
    (profileId) => {
      const next = new URLSearchParams(searchParams);
      next.set('profile', String(profileId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openProfile = useCallback(
    (row) => openProfileId(row.id),
    [openProfileId],
  );

  return (
    <div className="admin-watchtower mq-section">
      <AdminPageHeader
        title="Watchtower"
        subtitle={`${WATCHTOWER_TAB_LABELS[activeTab] ?? activeTab} · MVP 1.2 · ops (только admin)`}
      >
        <div className="admin-watchtower__actions">
          <Button
            size="s"
            mode="bezeled"
            disabled={!!exporting}
            onClick={async () => {
              setExporting('profiles');
              try {
                await adminApi.exportProfilesCsv({
                  limit: 500,
                  profile_filter: profileFilter || undefined,
                  q: profileSearch || undefined,
                });
              } catch (e) {
                setError(e?.message || 'CSV профилей');
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === 'profiles' ? '…' : 'CSV профили'}
          </Button>
          <Button
            size="s"
            mode="bezeled"
            disabled={!!exporting}
            onClick={async () => {
              setExporting('feedback');
              try {
                await adminApi.exportRunFeedbackCsv({ limit: 500 });
              } catch (e) {
                setError(e?.message || 'CSV отзывов');
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === 'feedback' ? '…' : 'CSV отзывы'}
          </Button>
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
      </AdminPageHeader>

      <nav className="mq-admin-watchtower-tabs" aria-label="Раздел Watchtower">
        {Object.entries(WATCHTOWER_TAB_LABELS).map(([id, label]) => {
          const next = new URLSearchParams(searchParams);
          next.set('tab', id);
          const active = activeTab === id;
          return (
            <Link
              key={id}
              to={{ pathname: '/admin', search: `?${next.toString()}` }}
              className={`mq-admin-watchtower-tabs__tab${active ? ' mq-admin-watchtower-tabs__tab--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

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
          {activeTab === 'overview' ? (
            <>
              <MetricsSummary summary={data.metrics_summary} />
              <section className="mq-card admin-watchtower__block admin-attention">
                <h2 className="admin-watchtower__block-title">Очередь внимания</h2>
                <p className="mq-muted admin-watchtower__block-hint">
                  Застрявшие, поражения и свежие отзывы — клик открывает inspector сверху.
                </p>
                <AdminAttentionQueue
                  profiles={data.profiles ?? []}
                  runFeedback={data.run_feedback ?? []}
                  onOpenProfile={openProfileId}
                />
              </section>
            </>
          ) : null}

          {activeTab === 'guidance' ? (
            <OnboardingFunnel funnel={data.onboarding_funnel} />
          ) : null}

          {activeTab === 'players' ? (
            <div className="admin-watchtower__panels admin-watchtower__panels--split">
              <section className="mq-card admin-watchtower__block">
                <h2 className="admin-watchtower__block-title">Пользователи</h2>
                <AdminTable columns={userColumns} rows={users} highlightId={highlightUser} />
              </section>

              <section className="mq-card admin-watchtower__block">
                <h2 className="admin-watchtower__block-title">Профили</h2>
                <form className="admin-watchtower__search" onSubmit={applyProfileSearch}>
                  <input
                    className="mq-field__input"
                    type="search"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder="Логин или имя профиля…"
                    aria-label="Поиск профилей"
                  />
                  <Button size="s" type="submit">
                    Найти
                  </Button>
                  {profileSearch ? (
                    <Button
                      size="s"
                      mode="plain"
                      type="button"
                      onClick={() => {
                        setSearchDraft('');
                        const next = new URLSearchParams(searchParams);
                        next.delete('q');
                        setSearchParams(next, { replace: true });
                      }}
                    >
                      Сброс
                    </Button>
                  ) : null}
                </form>
                <div
                  className="admin-watchtower__filters"
                  role="toolbar"
                  aria-label="Фильтр профилей"
                >
                  {PROFILE_FILTERS.map((f) => (
                    <button
                      key={f.id || 'all'}
                      type="button"
                      className={[
                        'admin-watchtower__filter-chip',
                        profileFilter === f.id ? 'admin-watchtower__filter-chip--active' : null,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setProfileFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <AdminTable
                  columns={profileColumns}
                  rows={profiles}
                  highlightId={highlightProfile}
                  onRowClick={openProfile}
                />
              </section>
            </div>
          ) : null}

          {activeTab === 'alerts' ? (
            <section className="mq-card admin-watchtower__block">
              <h2 className="admin-watchtower__block-title">Журнал алертов</h2>
              <AdminTable
                columns={notificationColumns}
                rows={notifications}
                onRowClick={(r) => {
                  const pid = notificationProfileId(r);
                  if (pid) openProfileId(pid);
                }}
              />
            </section>
          ) : null}

          {activeTab === 'feedback' ? (
            <section className="mq-card admin-watchtower__block">
              <h2 className="admin-watchtower__block-title">Отзывы с финала партии</h2>
              <p className="mq-muted admin-watchtower__block-hint">
                GE1 · комментарии с экрана победы/поражения ({runFeedback.length})
              </p>
              <AdminTable
                columns={runFeedbackColumns}
                rows={runFeedback}
                emptyText="Пока нет отзывов."
                onRowClick={(r) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('profile', String(r.game_profile_id));
                  setSearchParams(next, { replace: true });
                }}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
