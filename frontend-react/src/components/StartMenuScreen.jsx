import { useState, useEffect, useCallback } from 'react';
import { Modal, Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { showNotification } from './notifications';
import { MonetkaBubbleScreen } from './mqx/layout/MonetkaBubbleScreen';
import { MqxButton } from './mqx/primitives/MqxButton';
import { MoneyText } from './MoneyText';
import { suggestDefaultProfileName } from '../utils/suggestDefaultProfileName';

function saveKindLabel(sk) {
  if (sk === 'game') return 'Игра';
  if (sk === 'plan') return 'План';
  return sk || '—';
}

function profileSubtitle(p) {
  const kind = saveKindLabel(p.save_kind);
  let extra = '';
  if (p.starter_template_key) extra = ` · ${p.starter_template_key}`;
  else if (p.save_kind === 'game') extra = ' · без шаблона';
  return `Период ${p.period_index} · ${kind}${extra}`;
}

function menuCopy({ loading, profileCount }) {
  if (loading) {
    return {
      title: 'Секунду, листаю полки',
      subtitle: 'Подтягиваю твои сохранения…',
    };
  }
  if (profileCount === 0) {
    return {
      title: 'Пока пусто на полке',
      subtitle:
        'Начнём первый финансовый сценарий? Жми «Новая игра» — дальше выберешь режим и жизненную ситуацию.',
    };
  }
  return {
    title: 'Продолжим с того же места?',
    subtitle:
      profileCount > 1
        ? 'Ниже последний слот — один тап. Остальные в «Все сохранения».'
        : 'Твой слот ниже — продолжить или завести новое сохранение.',
  };
}

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
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось загрузить сохранение', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  const primaryProfile = profiles.find((p) => p.is_active) || profiles[0];
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return (b.id || 0) - (a.id || 0);
  });

  const { title, subtitle } = menuCopy({
    loading,
    profileCount: profiles.length,
  });

  return (
    <>
      <MonetkaBubbleScreen
        showBrand
        showLottieBackdrop
        title={title}
        subtitle={subtitle}
        titleId="mqx-start-menu-title"
        bubbleClassName="mqx-auth-monetka__bubble--wide"
      >
        {loading ? (
          <div className="mqx-auth-monetka__loading">
            <Spinner />
          </div>
        ) : (
          <>
            {primaryProfile ? (
              <div className="mqx-start-menu__profile mqx-fin-row">
                <div className="mqx-fin-row__l">
                  <div className="mqx-fin-row__title">{primaryProfile.name}</div>
                  <div className="mqx-fin-row__sub">{profileSubtitle(primaryProfile)}</div>
                </div>
                <div className="mqx-fin-row__r">
                  <div className="mqx-fin-row__val">
                    <MoneyText value={Number(primaryProfile.cash_balance || 0)} />
                  </div>
                  <MqxButton
                    variant="primary"
                    size="compact"
                    title={`Продолжить «${primaryProfile.name}»`}
                    onClick={() => handleActivate(primaryProfile.id)}
                  >
                    Продолжить
                  </MqxButton>
                </div>
              </div>
            ) : null}

            <div className="mqx-auth-monetka__actions mqx-start-menu__actions">
              <MqxButton
                variant="primary"
                stretched
                onClick={() => onNewGame?.(suggestDefaultProfileName(profiles))}
                title="Создать новое сохранение"
              >
                Новая игра
              </MqxButton>
              <MqxButton
                variant="secondary"
                stretched
                onClick={() => setShowLoadModal(true)}
                disabled={profiles.length === 0}
                title="Открыть список всех сохранений"
              >
                Все сохранения{profiles.length > 0 ? ` (${profiles.length})` : ''}
              </MqxButton>
              <MqxButton variant="ghost" stretched onClick={handleLogout} title="Выйти из аккаунта">
                Выйти
              </MqxButton>
            </div>
          </>
        )}
      </MonetkaBubbleScreen>

      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)} title="Все сохранения">
        <div className="mqx-modal" role="document" aria-labelledby="mqx-load-profiles-title">
          <div className="mqx-card">
            <h2 id="mqx-load-profiles-title" className="mqx-card__title">
              Все сохранения
            </h2>
            <p className="mqx-card__sub">Выберите слот — переключусь без лишних вопросов.</p>
            <div className="mqx-fin-list mqx-start-menu__modal-list">
              {sortedProfiles.map((profile) => (
                <div key={profile.id} className="mqx-fin-row mqx-start-menu__modal-row">
                  <div className="mqx-fin-row__l">
                    <div className="mqx-fin-row__title">
                      {profile.name}
                      {profile.is_active ? (
                        <span className="mqx-start-menu__active-pill">активен</span>
                      ) : null}
                    </div>
                    <div className="mqx-fin-row__sub">{profileSubtitle(profile)}</div>
                  </div>
                  <div className="mqx-fin-row__r">
                    <MqxButton
                      variant={profile.is_active ? 'secondary' : 'primary'}
                      size="compact"
                      title={`Загрузить «${profile.name}»`}
                      onClick={() => {
                        void handleActivate(profile.id);
                        setShowLoadModal(false);
                      }}
                    >
                      {profile.is_active ? 'Открыть' : 'Загрузить'}
                    </MqxButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
