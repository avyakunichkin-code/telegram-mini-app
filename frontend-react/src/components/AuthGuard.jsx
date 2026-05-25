import { Navigate } from 'react-router-dom';
import { Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { MonetkaBubbleScreen } from './mqx/layout/MonetkaBubbleScreen';

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-shell mq-page mq-page--auth">
        <div className="mq-page__decor" aria-hidden />
        <MonetkaBubbleScreen
          title="Секунду, листаю полки"
          subtitle="Подтягиваю твои сохранения… обычно это занимает секунду."
          titleId="mqx-auth-loading-title"
        >
          <div className="mqx-auth-monetka__loading">
            <Spinner />
          </div>
        </MonetkaBubbleScreen>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
