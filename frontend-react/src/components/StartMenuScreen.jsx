import { useState, useEffect } from 'react';
import { Button, Cell, Section, List, Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';

export function StartMenuScreen({ onNewGame, onLoadGame, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await API.getGameProfiles();
    if (data) setProfiles(data);
    setLoading(false);
  };

  const handleActivate = async (profileId) => {
    await API.activateGameProfile(profileId);
    if (onLoadGame) onLoadGame();
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1rem' }}>
      <Section header="Игровые профили">
        <List>
          {profiles.length === 0 && (
            <Cell>
              <div>Нет сохранений. Нажмите "Новая игра"</div>
            </Cell>
          )}
          {profiles.map((profile) => (
            <Cell
              key={profile.id}
              multiline
              subtitle={`Период: ${profile.period_index} | ${profile.mode}`}
              after={
                <Button
                  mode="filled"
                  size="s"
                  onClick={() => handleActivate(profile.id)}
                >
                  {profile.is_active ? 'Продолжить' : 'Загрузить'}
                </Button>
              }
            >
              {profile.name}
            </Cell>
          ))}
        </List>
      </Section>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Button mode="filled" onClick={onNewGame}>Новая игра</Button>
        <Button mode="outline" onClick={loadProfiles}>Обновить список</Button>
        <Button mode="plain" onClick={handleLogout}>Выйти</Button>
      </div>
    </div>
  );
}