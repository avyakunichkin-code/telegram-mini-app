import { Navigate } from 'react-router-dom';
import { Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';

export function AuthGuard({ children, layout = 'tma' }) {
  const { user, loading } = useAuth();

  if (loading) {
    if (layout === 'admin') {
      return (
        <div className="mq-admin-web__loading" role="status" aria-live="polite">
          <Spinner size="m" />
          <span className="mq-muted">Проверяем доступ…</span>
        </div>
      );
    }
    // TMA: полноэкранный bootstrap — AppBootstrapGate
    return null;
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
