import { Navigate } from 'react-router-dom';
import { Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="mq-page mq-page--center" style={{ padding: 16 }}>
        <div className="mq-page__decor" aria-hidden />
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}