import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GuidanceBadge } from './AdminGuidanceBadge';
import { formatAdminDt } from './adminFormat';
import { notificationProfileId } from './adminUtils';

export function useAdminUserColumns() {
  return useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id, sortable: true, sortValue: (r) => r.id },
      {
        key: 'username',
        label: 'Логин',
        render: (r) => (
          <Link
            to={`/admin/profiles?user_id=${r.id}&user_label=${encodeURIComponent(r.username)}`}
            className="admin-inspector__link"
            onClick={(e) => e.stopPropagation()}
          >
            {r.username}
          </Link>
        ),
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
}

export function useAdminProfileColumns({ searchParams, setSearchParams, openProfileId }) {
  return useMemo(
    () => [
      { key: 'id', label: 'ID', render: (r) => r.id, sortable: true, sortValue: (r) => r.id },
      {
        key: 'user',
        label: 'User',
        render: (r) => (
          <Link
            to={`/admin/profiles?user_id=${r.user_id}&user_label=${encodeURIComponent(r.username)}`}
            className="admin-inspector__link"
            onClick={(e) => e.stopPropagation()}
          >
            {r.username}
          </Link>
        ),
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
            <span className="admin-watchtower__badge admin-watchtower__badge--stuck">онбординг</span>
          ) : r.stuck_kind === 'player_stuck' ? (
            <span className="admin-watchtower__badge admin-watchtower__badge--stuck">игра</span>
          ) : (
            '—'
          ),
      },
      { key: 'active', label: 'Активен', render: (r) => (r.is_active ? 'да' : 'нет') },
    ],
    [searchParams, setSearchParams],
  );
}

export function useAdminNotificationColumns({ searchParams, setSearchParams }) {
  return useMemo(
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
}

export const PROFILE_FILTERS = [
  { id: '', label: 'Все' },
  { id: 'stuck', label: 'Застрял' },
  { id: 'guidance_draft', label: 'Guidance draft' },
  { id: 'defeat', label: 'Поражение' },
  { id: 'victory', label: 'Победа' },
];
