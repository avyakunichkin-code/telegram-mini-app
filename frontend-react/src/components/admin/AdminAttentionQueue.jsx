import { buildAttentionQueue } from './adminUtils';

export function AdminAttentionQueue({ profiles, runFeedback, onOpenProfile }) {
  const items = buildAttentionQueue({ profiles, runFeedback });
  if (!items.length) {
    return (
      <p className="mq-muted admin-attention__empty">Сейчас нет явных сигналов внимания.</p>
    );
  }

  return (
    <ul className="admin-attention__list">
      {items.map((item) => (
        <li key={`${item.kind}-${item.profileId}-${item.feedbackId ?? ''}`}>
          <button
            type="button"
            className="admin-attention__item"
            onClick={() => onOpenProfile(item.profileId)}
          >
            <span className="admin-attention__label">{item.label}</span>
            <span className="admin-attention__meta">
              {item.name} · {item.username}
              {item.preview ? ` — ${item.preview}` : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
