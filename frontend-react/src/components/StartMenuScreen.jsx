import { useState, useEffect } from 'react';
import { Button, Cell, Section, List, Modal, Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';

export function StartMenuScreen({ onNewGame, onLoadGame, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await API.getGameProfiles();
      setProfiles(data || []);
    } catch (e) {
      setProfiles([]);
    }
    setLoading(false);
  };

  const handleActivate = async (profileId) => {
    try {
      await API.activateGameProfile(profileId);
      if (onLoadGame) onLoadGame();
    } catch (e) {
      // на MVP молча остаёмся на экране
    }
  };

  const lastProfile = profiles.find(p => p.is_active) || profiles[0];
  const otherProfiles = profiles.filter(p => p !== lastProfile);

  if (loading) {
    return (
      <div className="mq-page mq-page--center" style={{ padding: 16 }}>
        <div className="mq-page__decor" aria-hidden />
        <Spinner />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <div className="mq-page mq-stack mq-stack-animate mq-stack--tight" style={{ padding: '12px 12px calc(24px + env(safe-area-inset-bottom, 0))' }}>
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-enter-item">
      <Section header="Игровые профили">
        {lastProfile ? (
          <Cell
            multiline
            subtitle={`Период: ${lastProfile.period_index} | ${lastProfile.mode}`}
            after={
              <Button mode="filled" size="s" onClick={() => handleActivate(lastProfile.id)}>
                Продолжить
              </Button>
            }
          >
            {lastProfile.name}
          </Cell>
        ) : (
          <Cell>Нет сохранений. Нажмите "Новая игра"</Cell>
        )}
      </Section>
      </div>

      <div className="mq-enter-item mq-actions-stack">
        <Button mode="filled" onClick={onNewGame}>Новая игра</Button>
        <Button mode="outline" onClick={() => setShowLoadModal(true)} disabled={profiles.length === 0}>
          Загрузка
        </Button>
        <Button mode="plain" onClick={handleLogout}>Выйти</Button>
      </div>

      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)}>
        <Section header="Все сохранения">
          <List>
            {otherProfiles.map(profile => (
              <Cell
                key={profile.id}
                multiline
                subtitle={`Период: ${profile.period_index} | ${profile.mode}`}
                after={
                  <Button mode="filled" size="s" onClick={() => { handleActivate(profile.id); setShowLoadModal(false); }}>
                    Загрузить
                  </Button>
                }
              >
                {profile.name}
              </Cell>
            ))}
          </List>
        </Section>
      </Modal>
    </div>
  );
}