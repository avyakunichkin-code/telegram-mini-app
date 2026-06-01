import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { GuidanceBadge } from './AdminGuidanceBadge';

function formatDt(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return String(value);
  }
}

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
  } catch {
    /* ignore */
  }
}

function ClosingsSparkline({ closings }) {
  const points = [...(closings ?? [])].sort((a, b) => a.period_index - b.period_index);
  if (points.length === 0) return null;
  const values = points.map((p) => Number(p.cash_balance) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return (
    <div className="admin-inspector__sparkline" aria-hidden>
      {points.map((row, idx) => {
        const h = Math.max(8, Math.round(((values[idx] - min) / span) * 48) + 8);
        const negative = Number(row.cash_balance) < 0;
        return (
          <div
            key={row.period_index}
            className={[
              'admin-inspector__spark-bar',
              negative ? 'admin-inspector__spark-bar--neg' : null,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ height: `${h}px` }}
            title={`П${row.period_index}: ${row.cash_balance} ₽`}
          />
        );
      })}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="admin-inspector__stat">
      <span className="admin-inspector__stat-label">{label}</span>
      <strong>{value}</strong>
      {sub ? <span className="admin-inspector__stat-sub">{sub}</span> : null}
    </div>
  );
}

export function AdminProfileInspectorPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const profileId = searchParams.get('profile');

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logKind, setLogKind] = useState('');

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('profile');
    setSearchParams(next, { replace: true });
    setDetail(null);
    setError(null);
  }, [searchParams, setSearchParams]);

  const load = useCallback(async () => {
    if (!profileId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.profileDetail(profileId);
      setDetail(payload);
    } catch (e) {
      setDetail(null);
      setError(e?.detail || e?.message || 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const logKinds = useMemo(() => {
    const kinds = new Set((detail?.activity_log ?? []).map((row) => row.kind).filter(Boolean));
    return [...kinds].sort();
  }, [detail?.activity_log]);

  if (!profileId) return null;

  const p = detail?.profile;
  const u = detail?.user;
  const fb = detail?.latest_run_feedback;
  const filteredLog = (detail?.activity_log ?? []).filter(
    (row) => !logKind || row.kind === logKind,
  );

  return (
    <section className="mq-card admin-inspector" aria-labelledby="admin-inspector-title">
      <header className="admin-inspector__header">
        <div>
          <h2 id="admin-inspector-title" className="admin-watchtower__block-title">
            Профиль #{profileId}
            {p ? ` · ${p.name}` : ''}
          </h2>
          {p ? (
            <p className="mq-muted admin-inspector__subtitle">
              {p.username} · {p.starter_template_key || '—'} · период {p.period_index}
            </p>
          ) : null}
        </div>
        <div className="admin-inspector__actions">
          <Button size="s" mode="bezeled" onClick={load} disabled={loading}>
            Обновить
          </Button>
          <Button size="s" mode="plain" onClick={close}>
            Закрыть
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="admin-inspector__loading">
          <Spinner size="m" />
        </div>
      ) : null}

      {error ? (
        <p className="admin-inspector__error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && detail && p ? (
        <>
          <div className="admin-inspector__stats">
            <Stat label="Cash" value={formatMoney(p.cash_balance)} />
            <Stat label="Подушка" value={formatMoney(p.safety_fund_balance)} />
            <Stat
              label="Период"
              value={p.period_index}
              sub={`${p.time_state} · ${p.period_duration_seconds}s`}
            />
            <Stat
              label="Guidance"
              value={<GuidanceBadge completed={p.guidance_completed} />}
              sub={p.guidance_current_beat || (p.guidance_completed ? 'завершён' : '—')}
            />
            <Stat
              label="Победа"
              value={detail.economy?.win_reached ? 'да' : 'нет'}
              sub={`streak ${p.clean_period_streak}`}
            />
          </div>

          <div className="admin-inspector__meta">
            <span>
              User #{u?.id} {u?.telegram_id ? `(TG ${u.telegram_id})` : ''}
            </span>
            <button type="button" className="admin-inspector__link" onClick={() => copyText(p.id)}>
              profile_id
            </button>
            <button type="button" className="admin-inspector__link" onClick={() => copyText(p.user_id)}>
              user_id
            </button>
            <button
              type="button"
              className="admin-inspector__link"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('user', String(p.user_id));
                setSearchParams(next, { replace: true });
              }}
            >
              Подсветить user
            </button>
            {p.is_archived ? (
              <span className="admin-watchtower__badge admin-watchtower__badge--archived">
                в архиве
              </span>
            ) : null}
            {p.guidance_completed_beats?.length ? (
              <span className="admin-inspector__beats">
                beats: {p.guidance_completed_beats.join(', ')}
              </span>
            ) : null}
          </div>

          {fb ? (
            <div className="admin-inspector__feedback mq-card">
              <h3 className="admin-inspector__panel-title">Последний отзыв с финала</h3>
              <p className="admin-inspector__feedback-meta">
                <span
                  className={
                    fb.outcome === 'victory'
                      ? 'admin-watchtower__badge admin-watchtower__badge--win'
                      : 'admin-watchtower__badge admin-watchtower__badge--loss'
                  }
                >
                  {fb.outcome_label || fb.outcome}
                </span>
                {' · '}
                период {fb.period_index}
                {fb.template_key ? ` · ${fb.template_key}` : ''}
                {' · '}
                {formatDt(fb.created_at)}
              </p>
              <p className="admin-inspector__feedback-comment">{fb.comment}</p>
              {fb.defeat_reason ? (
                <p className="mq-muted admin-inspector__feedback-reason">
                  Причина: {fb.defeat_reason}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="admin-inspector__grid">
            <div className="admin-inspector__panel">
              <h3 className="admin-inspector__panel-title">Закрытия периодов</h3>
              <ClosingsSparkline closings={detail.period_closings} />
              {(detail.period_closings ?? []).length === 0 ? (
                <p className="mq-muted">Пока нет закрытий</p>
              ) : (
                <div className="admin-watchtower__table-wrap">
                  <table className="admin-watchtower__table admin-inspector__table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Cash</th>
                        <th>Подушка</th>
                        <th>Просрочка</th>
                        <th>Расход</th>
                        <th>Когда</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.period_closings.map((row) => (
                        <tr key={row.period_index}>
                          <td>{row.period_index}</td>
                          <td>{formatMoney(row.cash_balance)}</td>
                          <td>{formatMoney(row.safety_fund_balance)}</td>
                          <td>{formatMoney(row.total_overdue_amount)}</td>
                          <td>{formatMoney(row.period_expense_total)}</td>
                          <td>{formatDt(row.closed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-inspector__panel">
              <h3 className="admin-inspector__panel-title">Журнал активности</h3>
              {logKinds.length > 0 ? (
                <label className="admin-inspector__log-filter">
                  <span className="mq-muted">Тип</span>
                  <select value={logKind} onChange={(e) => setLogKind(e.target.value)}>
                    <option value="">Все</option>
                    {logKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {filteredLog.length === 0 ? (
                <p className="mq-muted">Записей нет</p>
              ) : (
                <ul className="admin-inspector__log">
                  {filteredLog.map((row) => (
                    <li key={row.id} className="admin-inspector__log-item">
                      <div className="admin-inspector__log-head">
                        <span className="admin-inspector__log-kind">
                          {row.kind_label || row.kind}
                        </span>
                        <span className="admin-inspector__log-when">{formatDt(row.created_at)}</span>
                      </div>
                      <p className="admin-inspector__log-summary">
                        {(row.summary || row.kind).split('\n')[0]}
                      </p>
                      <span className="admin-inspector__log-meta">
                        {row.audience}
                        {row.telegram_sent ? ' · TG' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
