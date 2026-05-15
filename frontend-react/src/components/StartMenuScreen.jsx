import { useState, useEffect } from 'react';
import { Button, List, Modal, Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { MqxShell } from './MqxShell';
import { MoneyText } from './MoneyText';

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
      <MqxShell
        header={
          <header className="mqx-hero mqx-hero--tab">
            <div className="mqx-hero__glow" aria-hidden />
            <div className="mqx-hero__top">
              <div className="mqx-hero-pills">
                <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
                <span className="mqx-hero-pill">Профили</span>
              </div>
              <span className="mqx-hero-pill mqx-hero-pill--ghost">Старт</span>
            </div>
            <div className="mqx-hero__title mqx-hero__title--tab">Продолжить игру</div>
            <div className="mqx-hero__sub">Активный слот — один тап. Остальные сохранения — в списке.</div>
          </header>
        }
      >
        <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
          <Spinner />
        </div>
      </MqxShell>
    );
  }

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <MqxShell
      header={
        <header className="mqx-hero mqx-hero--tab">
          <div className="mqx-hero__glow" aria-hidden />
          <div className="mqx-hero__top">
            <div className="mqx-hero-pills">
              <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
              <span className="mqx-hero-pill">Профили</span>
            </div>
            <span className="mqx-hero-pill mqx-hero-pill--ghost">{profiles.length} слотов</span>
          </div>
          <div className="mqx-hero__title mqx-hero__title--tab">Продолжить игру</div>
          <div className="mqx-hero__sub">Выберите активный слот или создайте новый профиль.</div>
        </header>
      }
    >
      <div className="mqx-card">
        <div className="mqx-card__title">Активный профиль</div>
        <div className="mqx-card__sub">Быстрый старт: один тап — и вы в периоде.</div>

        {lastProfile ? (
          <div className="mqx-fin-row" style={{ marginTop: 12 }}>
            <div className="mqx-fin-row__l">
              <div className="mqx-fin-row__title">{lastProfile.name}</div>
              <div className="mqx-fin-row__sub">
                Период {lastProfile.period_index}
                {' · '}
                {lastProfile.save_kind === 'game' ? 'Игра' : lastProfile.save_kind}
                {lastProfile.starter_template_key
                  ? ` · ${lastProfile.starter_template_key}`
                  : ', свой старт'}
              </div>
            </div>
            <div className="mqx-fin-row__r">
              <div className="mqx-fin-row__val">
                <MoneyText value={Number(lastProfile.cash_balance || 0)} />
              </div>
              <Button mode="filled" size="s" onClick={() => handleActivate(lastProfile.id)}>
                Продолжить
              </Button>
            </div>
          </div>
        ) : (
          <div className="mqx-fin-empty" style={{ marginTop: 12 }}>Пока нет сохранений в этом аккаунте.</div>
        )}
      </div>

      <div className="mqx-card">
        <div className="mqx-card__title">Действия</div>
        <div className="mqx-card__sub">Для демо и инвесторской презентации — всё по делу.</div>
        <div className="mq-actions-stack" style={{ marginTop: 12 }}>
          <Button mode="filled" onClick={onNewGame}>Новая игра</Button>
          <Button mode="outline" onClick={() => setShowLoadModal(true)} disabled={profiles.length === 0}>
            Все сохранения
          </Button>
          <Button mode="plain" onClick={handleLogout}>Выйти</Button>
        </div>
      </div>

      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)}>
        <div className="mqx-modal">
          <div className="mqx-card">
            <div className="mqx-card__title">Все сохранения</div>
            <div className="mqx-card__sub">Выберите слот и нажмите «Загрузить».</div>
            <List>
              {otherProfiles.map(profile => (
                <div key={profile.id} className="mqx-fin-row" style={{ marginTop: 10 }}>
                  <div className="mqx-fin-row__l">
                    <div className="mqx-fin-row__title">{profile.name}</div>
                    <div className="mqx-fin-row__sub">
                      Период {profile.period_index}
                      {' · '}
                      {profile.save_kind === 'game' ? 'Игра' : profile.save_kind}
                      {profile.starter_template_key ? ` · ${profile.starter_template_key}` : ', свой старт'}
                    </div>
                  </div>
                  <div className="mqx-fin-row__r">
                    <Button mode="filled" size="s" onClick={() => { handleActivate(profile.id); setShowLoadModal(false); }}>
                      Загрузить
                    </Button>
                  </div>
                </div>
              ))}
            </List>
          </div>
        </div>
      </Modal>
    </MqxShell>
  );
}