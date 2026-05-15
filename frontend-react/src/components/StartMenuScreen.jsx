import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';
import { MoneyText } from './MoneyText';

export function StartMenuScreen({ onNewGame, onLoadGame, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { logout } = useAuth();

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await API.getGameProfiles();
      setProfiles(data || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- первичная загрузка списка профилей
    void loadProfiles();
  }, [loadProfiles]);

  const handleActivate = async (profileId) => {
    try {
      await API.activateGameProfile(profileId);
      if (onLoadGame) onLoadGame();
    } catch {
      // на MVP молча остаёмся на экране
    }
  };

  const lastProfile = profiles.find((p) => p.is_active) || profiles[0];
  const otherProfiles = profiles.filter((p) => p !== lastProfile);

  const saveKindLabel = (sk) => {
    if (sk === 'game') return 'Игра';
    if (sk === 'plan') return 'План';
    return sk || '—';
  };

  const profileSubtitle = (p) => {
    const kind = saveKindLabel(p.save_kind);
    let extra = '';
    if (p.starter_template_key) extra = ` · ${p.starter_template_key}`;
    else if (p.save_kind === 'game') extra = ' · без шаблона';
    return `Период ${p.period_index} · ${kind}${extra}`;
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  if (loading) {
    return (
      <MqxShell
        header={
          <MqxTabHero
            sectionLabel="Профили"
            rightPill="…"
            title="Загрузка слотов"
            subtitle="Подтягиваем сохранения аккаунта."
          />
        }
      >
        <div className="mqx-card" style={{ display: 'grid', placeItems: 'center', minHeight: 120, padding: 28 }}>
          <Spinner />
        </div>
      </MqxShell>
    );
  }

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Профили"
          rightPill={`${profiles.length} слотов`}
          title="Продолжить игру"
          subtitle="Активный слот — один тап. Остальные — в модалке «Все сохранения»."
        />
      }
    >
      <div className="mq-stack mq-stack--tight mq-stack-animate">
        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Быстрый старт</div>
          <div className="mqx-card__title">Активный профиль</div>
          <div className="mqx-card__sub">Как на главном табло: карточка и действие без лишней обвязки.</div>

          {lastProfile ? (
            <div className="mqx-fin-row" style={{ marginTop: 14 }}>
              <div className="mqx-fin-row__l">
                <div className="mqx-fin-row__title">{lastProfile.name}</div>
                <div className="mqx-fin-row__sub">{profileSubtitle(lastProfile)}</div>
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
            <div className="mqx-fin-empty" style={{ marginTop: 14 }}>
              Пока нет сохранений в этом аккаунте.
            </div>
          )}
        </div>

        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__title">Действия</div>
          <div className="mqx-card__sub">Новая игра или список слотов — в одном визуальном ряду с игрой.</div>
          <div className="mq-actions-stack" style={{ marginTop: 14 }}>
            <Button mode="filled" onClick={onNewGame}>
              Новая игра
            </Button>
            <Button mode="outline" onClick={() => setShowLoadModal(true)} disabled={profiles.length === 0}>
              Все сохранения
            </Button>
            <Button mode="plain" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)}>
        <div className="mqx-modal">
          <div className="mqx-card">
            <div className="mqx-card__title">Все сохранения</div>
            <p className="mqx-card__sub">Выберите слот и нажмите «Загрузить».</p>
            <div className="mqx-fin-list" style={{ marginTop: 12 }}>
              {otherProfiles.map((profile) => (
                <div key={profile.id} className="mqx-fin-row" style={{ marginTop: 10 }}>
                  <div className="mqx-fin-row__l">
                    <div className="mqx-fin-row__title">{profile.name}</div>
                    <div className="mqx-fin-row__sub">{profileSubtitle(profile)}</div>
                  </div>
                  <div className="mqx-fin-row__r">
                    <Button
                      mode="filled"
                      size="s"
                      onClick={() => {
                        void handleActivate(profile.id);
                        setShowLoadModal(false);
                      }}
                    >
                      Загрузить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </MqxShell>
  );
}
