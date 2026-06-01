export function GuidanceBadge({ completed }) {
  if (completed) {
    return (
      <span className="admin-watchtower__badge admin-watchtower__badge--done">
        guidance ✓
      </span>
    );
  }
  return (
    <span className="admin-watchtower__badge admin-watchtower__badge--draft">
      guidance
    </span>
  );
}
