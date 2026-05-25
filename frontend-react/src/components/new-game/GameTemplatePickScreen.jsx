import { useEffect, useState } from 'react';
import { Input, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../../api';
import { showNotification } from '../notifications';
import { MqxMonetkaDialogScreen } from '../mqx/layout/MqxMonetkaDialogScreen';
import { MqxStarterScenarioPicker } from '../mqx/layout/MqxStarterScenarioPicker';
import { MqxButton } from '../mqx/primitives/MqxButton';
import { DEFAULT_PERIOD_DURATION_SECONDS, normalizeStarterTemplate } from '../../config/gameDefaults';
import { startGameWithSimplestTemplate } from '../../utils/startGame';

/**
 * Шаг 2 (Game): название игры + шаблон старта или быстрый старт.
 */
export function GameTemplatePickScreen({ profileName, onProfileNameChange, onBack, onJumpToGame }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [quickStarting, setQuickStarting] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  const trimmedName = profileName?.trim() || '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await API.listGameTemplates('game');
        if (cancelled) return;
        const raw = Array.isArray(rows) ? rows : [];
        const list = raw.map(normalizeStarterTemplate).filter(Boolean);
        setTemplates(list);
        const firstKey = list.length ? list[0].template_key : null;
        setSelectedKey(firstKey ? String(firstKey) : null);
      } catch {
        if (!cancelled) {
          setTemplates([]);
          setSelectedKey(null);
          showNotification('Не удалось загрузить шаблоны', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureGameName = () => {
    if (!trimmedName) {
      showNotification('Введите название игры', 'error');
      return false;
    }
    return true;
  };

  const handleStart = async () => {
    if (!ensureGameName()) return;
    if (!selectedKey) {
      showNotification('Выберите шаблон старта', 'error');
      return;
    }
    setStarting(true);
    try {
      await API.startNewGame({
        profile_name: trimmedName,
        save_kind: 'game',
        template_key: selectedKey,
        period_duration_seconds: DEFAULT_PERIOD_DURATION_SECONDS,
      });
      onJumpToGame();
    } catch (error) {
      showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleQuickStart = async () => {
    if (!ensureGameName()) return;
    setQuickStarting(true);
    try {
      await startGameWithSimplestTemplate(trimmedName);
      onJumpToGame();
    } catch (error) {
      showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
    } finally {
      setQuickStarting(false);
    }
  };

  const busy = starting || quickStarting;

  return (
    <MqxMonetkaDialogScreen
      showBrand
      title="Четыре ритма"
      subtitle={
        <p>
          Ух ты, четыре жизни с разным ритмом. Начни со <strong>Старта</strong> или сразу лови <strong>Драйв</strong> —
          ты сам выбираешь, насколько насыщенной будет игра.
        </p>
      }
      titleId="mqx-new-game-templates-title"
    >
      <div className="mqx-form mqx-monetka-flow__form">
        <Input
          id="new-game-profile-name"
          name="profile_name"
          header="Название игры"
          value={profileName}
          onChange={(e) => onProfileNameChange(e.target.value)}
          autoComplete="off"
          required
        />
      </div>

      {loading ? (
        <div className="mqx-monetka-flow__loading">
          <Spinner />
        </div>
      ) : templates.length === 0 ? (
        <p className="mqx-monetka-flow__empty">Шаблоны не загрузились. Проверьте сеть и попробуйте позже.</p>
      ) : (
        <>
          <span id="mq-game-catalog-label-pick" className="mq-game-catalog-label">
            Сценарий
          </span>
          <MqxStarterScenarioPicker
            templates={templates}
            value={selectedKey}
            onChange={(key) => setSelectedKey(key == null ? null : String(key))}
            disabled={loading || busy}
            labelledById="mq-game-catalog-label-pick"
            layout="compact"
          />
        </>
      )}

      <div className="mqx-monetka-flow__actions">
        <MqxButton
          type="button"
          variant="primary"
          stretched
          disabled={loading || busy || !selectedKey}
          onClick={handleStart}
          title="Начать игру с выбранным шаблоном"
        >
          {starting ? 'Запуск…' : 'Начать игру'}
        </MqxButton>
        <MqxButton
          type="button"
          variant="secondary"
          stretched
          disabled={loading || busy || templates.length === 0}
          onClick={handleQuickStart}
          title="Сразу начать с самым простым сценарием"
        >
          {quickStarting ? 'Быстрый старт…' : 'Быстрый старт'}
        </MqxButton>
        <MqxButton
          type="button"
          variant="ghost"
          stretched
          onClick={onBack}
          disabled={busy}
          title="Вернуться к выбору режима"
        >
          Назад
        </MqxButton>
      </div>
    </MqxMonetkaDialogScreen>
  );
}
