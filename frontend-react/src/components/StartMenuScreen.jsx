import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { showNotification } from './notifications';
import { isRemoteProdApi } from '../api/client';
import { isPageColdUiActive, markPageColdUiComplete } from '../utils/apiWarmupSession';
import { AppBootstrapScreen } from './mqx/layout/AppBootstrapScreen';
import { BrandLogo } from './BrandLogo';
import { MqxSaveCard } from './mqx/pregame/MqxSaveCard';
import { MqxBoardButton } from './mqx/pregame/MqxBoardButton';
import { MqxSavesSheet } from './mqx/pregame/MqxSavesSheet';
import { savesCountHint } from './mqx/utils/pregameDisplay';
import { suggestDefaultProfileName } from '../utils/suggestDefaultProfileName';

/**
 * Меню до партии ★ BG-2: логотип, карта последнего сохранения с «Продолжить игру»,
 * спокойные кнопки «Новая игра» / «Все сохранения», текстовая «Выйти из аккаунта».
 */
export function StartMenuScreen({ onNewGame, onLoadGame, onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
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
      markPageColdUiComplete();
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- первичная загрузка списка профилей
    void loadProfiles();
  }, [loadProfiles]);

  const handleActivate = async (profileId) => {
    if (activatingId != null) return;
    setActivatingId(profileId);
    try {
      await API.activateGameProfile(profileId);
      if (onLoadGame) onLoadGame();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось загрузить сохранение', 'error');
      setActivatingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  const primaryProfile = profiles.find((p) => p.is_active) || profiles[0];
  const useColdBootstrap = loading && isRemoteProdApi() && isPageColdUiActive();

  if (useColdBootstrap) {
    return <AppBootstrapScreen mode="cold_start" />;
  }

  const newGame = () => onNewGame?.(suggestDefaultProfileName(profiles));

  return (
    <div className="mqx-pg">
      <h1 className="mqx-bg-sr-only">Меню</h1>
      <BrandLogo variant="full" className="mqx-pg-logo" />

      {loading ? (
        <div className="mqx-pg-state" role="status">
          <Spinner size="m" />
          <span>Подтягиваю сохранения…</span>
        </div>
      ) : (
        <>
          {primaryProfile ? (
            <MqxSaveCard
              templateKey={primaryProfile.starter_template_key}
              periodIndex={primaryProfile.period_index}
              cash={primaryProfile.cash_balance}
              note={`«${primaryProfile.name}»`}
              busy={activatingId != null}
              continueTitle={`Продолжить «${primaryProfile.name}»`}
              onContinue={() => handleActivate(primaryProfile.id)}
            />
          ) : (
            <section className="mqx-pg-empty" aria-label="Сохранений нет">
              <b>Сохранений пока нет</b>
              <small>Выбери жизнь и сделай первый ход</small>
              <button type="button" className="mqx-bg-btn mqx-bg-cta mqx-pg-cta" onClick={newGame}>
                Новая игра
              </button>
            </section>
          )}

          <div className="mqx-pg-actions">
            {primaryProfile ? (
              <MqxBoardButton hint="другая жизнь" onClick={newGame}>
                Новая игра
              </MqxBoardButton>
            ) : null}
            {profiles.length > 0 ? (
              <MqxBoardButton hint={savesCountHint(profiles.length)} onClick={() => setShowLoadModal(true)}>
                Все сохранения
              </MqxBoardButton>
            ) : null}
          </div>
          <MqxBoardButton variant="link" onClick={handleLogout}>
            Выйти из аккаунта
          </MqxBoardButton>
        </>
      )}

      <MqxSavesSheet
        open={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        profiles={profiles}
        busyId={activatingId}
        onPick={(id) => {
          setShowLoadModal(false);
          void handleActivate(id);
        }}
      />
    </div>
  );
}
