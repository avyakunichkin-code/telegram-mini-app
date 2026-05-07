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
        <div className="mq-screen-intro">Активный или последний профиль — быстрый старт. Остальные — в «Все сохранения».</div>
        {lastProfile ? (
          <Cell
            multiline
            subtitle={`Период ${lastProfile.period_index} · режим ${lastProfile.mode}`}
            after={
              <Button mode="filled" size="s" onClick={() => handleActivate(lastProfile.id)}>
                Продолжить
              </Button>
            }
          >
            <div className="mq-li-title">{lastProfile.name}</div>
          </Cell>
        ) : (
          <Cell multiline subtitle="Создайте первый профиль кнопкой ниже.">
            <div className="mq-caption-muted" style={{ marginTop: 0 }}>Пока нет сохранений в этом аккаунте.</div>
          </Cell>
        )}
      </Section>
      </div>

      <div className="mq-enter-item mq-actions-stack">
        <Button mode="filled" onClick={onNewGame}>Новая игра</Button>
        <Button mode="outline" onClick={() => setShowLoadModal(true)} disabled={profiles.length === 0}>
          Все сохранения
        </Button>
        <Button mode="plain" onClick={handleLogout}>Выйти</Button>
      </div>

      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)}>
        <Section header="Все сохранения">
          <div className="mq-screen-intro">Выберите слот и нажмите «Загрузить», чтобы сделать его активным.</div>
          <List>
            {otherProfiles.map(profile => (
              <Cell
                key={profile.id}
                multiline
                subtitle={`Период ${profile.period_index} · режим ${profile.mode}`}
                after={
                  <Button mode="filled" size="s" onClick={() => { handleActivate(profile.id); setShowLoadModal(false); }}>
                    Загрузить
                  </Button>
                }
              >
                <div className="mq-li-title">{profile.name}</div>
              </Cell>
            ))}
          </List>
        </Section>
      </Modal>
    </div>
  );
}