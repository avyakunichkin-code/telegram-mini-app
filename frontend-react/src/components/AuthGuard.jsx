import { Navigate } from 'react-router-dom';
import { Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';
import { AuthHeroBackdrop } from './AuthHeroBackdrop';

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-shell mq-page mq-page--auth">
        <div className="mq-page__decor" aria-hidden />
        <MqxShell
          header={
            <MqxTabHero
              sectionLabel="Сессия"
              rightPill="…"
              title="Проверка входа"
              subtitle="Подтягиваем профиль и токен. Обычно это занимает секунду."
            />
          }
          contentClassName="mqx-auth mqx-auth--lottie-bg"
        >
          <AuthHeroBackdrop />
          <div className="mq-auth-foreground">
            <div
              className="mqx-card"
              style={{ display: 'grid', placeItems: 'center', gap: 12, minHeight: 148, padding: 28 }}
            >
              <Spinner />
            </div>
          </div>
        </MqxShell>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
