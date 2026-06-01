import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { AdminAttentionQueue } from './AdminAttentionQueue';
import { AdminPageHeader } from './AdminPageHeader';
import { formatAdminDt } from './adminFormat';
import { AdminTable } from './adminTable';
import { AdminKpiGrid } from './ui/AdminKpiGrid';
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
      <AdminKpiGrid
        items={[
          { key: 'started', label: 'Стартов игр', value: funnel.started_profiles },
          { key: 'draft', label: 'В guidance', value: funnel.draft_profiles },
          { key: 'done', label: 'Завершили', value: funnel.brief_done_profiles },
          { key: 'conv', label: 'Конверсия', value: `${funnel.completion_rate_pct}%` },
        ]}
      />
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
      <AdminKpiGrid
        variant="summary"
        items={[
          {
            key: 'users',
            label: 'Пользователи',
            value: summary.users_total,
            sub: `+${summary.users_recent} за ${days}д`,
          },
          {
            key: 'profiles',
            label: 'Профили актив.',
            value: summary.profiles_active,
            sub: `всего ${summary.profiles_total}`,
          },
          {
            key: 'guidance',
            label: 'Guidance',
            value: summary.guidance_in_progress,
            sub: `✓ ${summary.guidance_completed_total} (+${summary.guidance_completed_recent})`,
          },
          {
            key: 'wins',
            label: 'Победы',
            value: summary.wins_total,
            sub: `+${summary.wins_recent} за ${days}д`,
          },
          {
            key: 'defeats',
            label: 'Поражения',
            value: summary.defeats_total ?? 0,
            sub: `+${summary.defeats_recent ?? 0} за ${days}д`,
          },
          {
            key: 'feedback',
            label: 'Отзывы',
            value: summary.run_feedback_recent ?? 0,
            sub: `за ${days}д`,
          },
          {
            key: 'p3',
            label: 'Период ≥3',
            value: summary.profiles_period_3_plus_active ?? 0,
            sub: `всего ${summary.profiles_period_3_plus_total ?? 0}`,
          },
          {
            key: 'avg',
            label: 'Ср. период',
            value: summary.avg_period_index_active,
            sub: `стартов +${summary.game_started_recent}`,
          },
        ]}
      />
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
      { key: 'id', label: 'ID', render: (r) => r.id, sortable: true, sortValue: (r) => r.id },
      {
        key: 'username',
        label: 'Логин',
        render: (r) => r.username,
        sortable: true,
        sortValue: (r) => r.username ?? '',
      },
      { key: 'telegram', label: 'TG', render: (r) => r.telegram_id ?? '—' },
      {
        key: 'profiles',
        label: 'Профили',
        render: (r) => r.profiles_count,
        sortable: true,
        sortValue: (r) => r.profiles_count ?? 0,
      },
      {
        key: 'created',
        label: 'Создан',
        render: (r) => formatAdminDt(r.created_at),
        sortable: true,
        sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : 0),
      },
    ],
    [],
  );

  const profileColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id, sortable: true, sortValue: (r) => r.id },
      {
        key: 'user',
        label: 'User',
        render: (r) => r.username,
        sortable: true,
        sortValue: (r) => r.username ?? '',
      },
      {
        key: 'name',
        label: 'Имя',
        render: (r) => r.name,
        sortable: true,
        sortValue: (r) => r.name ?? '',
      },
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
      {
        key: 'period',
        label: 'Период',
        render: (r) => r.period_index,
        sortable: true,
        sortValue: (r) => r.period_index ?? 0,
      },
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
      {
        key: 'cash',
        label: 'Cash',
        render: (r) => `${r.cash_balance} ₽`,
        sortable: true,
        sortValue: (r) => Number(r.cash_balance) || 0,
      },
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
      {
        key: 'when',
        label: 'Когда',
        render: (r) => formatAdminDt(r.created_at),
        sortable: true,
        sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : 0),
      },
      {
        key: 'kind',
        label: 'Тип',
        render: (r) => r.kind_label || r.kind,
        sortable: true,
        sortValue: (r) => r.kind_label || r.kind || '',
      },
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
      {
        key: 'when',
        label: 'Когда',
        render: (r) => formatAdminDt(r.created_at),
        sortable: true,
        sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : 0),
      },
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
      {
        key: 'period',
        label: 'Период',
        render: (r) => r.period_index,
        sortable: true,
        sortValue: (r) => r.period_index ?? 0,
      },
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
                <AdminTable
                  columns={userColumns}
                  rows={users}
                  highlightId={highlightUser}
                  maxHeight="min(70vh, 520px)"
                />
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
                  maxHeight="min(70vh, 560px)"
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
                maxHeight="min(75vh, 640px)"
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
                maxHeight="min(75vh, 640px)"
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
