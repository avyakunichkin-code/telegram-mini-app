import { useEffect, useState } from 'react';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../../api';
import { showNotification } from '../notifications';
import { MonetkaBubbleScreen } from '../mqx/layout/MonetkaBubbleScreen';
import { GameStarterPicker } from '../GameStarterPicker';
import { DEFAULT_PERIOD_DURATION_SECONDS, normalizeStarterTemplate } from '../../config/gameDefaults';
import { startGameWithSimplestTemplate } from '../../utils/startGame';

/**
 * Шаг 2 (Game): шаблон старта из каталога или быстрый старт.
 */
export function GameTemplatePickScreen({ profileName, onBack, onJumpToGame }) {
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

  const handleStart = async () => {
    if (!trimmedName) {
      showNotification('Нет названия профиля — вернитесь назад.', 'error');
      return;
    }
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
    if (!trimmedName) {
      showNotification('Нет названия профиля — вернитесь назад.', 'error');
      return;
    }
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
    <MonetkaBubbleScreen
      title="Отлично, осталось выбрать сценарий"
      subtitle={
        trimmedName
          ? `Слот «${trimmedName}». Чем проще метка — тем мягче старт. Лень выбирать — быстрый старт.`
          : 'Чем проще метка — тем мягче старт. Лень выбирать — быстрый старт.'
      }
      titleId="mqx-new-game-templates-title"
      bubbleClassName="mqx-auth-monetka__bubble--wide"
    >
      {loading ? (
        <div className="mqx-auth-monetka__loading">
          <Spinner />
        </div>
      ) : templates.length === 0 ? (
        <p className="mqx-auth-monetka__empty">Шаблоны не загрузились. Проверьте сеть и попробуйте позже.</p>
      ) : (
        <>
          <span id="mq-game-catalog-label-pick" className="mq-game-catalog-label">
            Выберите шаблон
          </span>
          <GameStarterPicker
            templates={templates}
            value={selectedKey}
            onChange={(key) => setSelectedKey(key == null ? null : String(key))}
            disabled={loading || busy}
            labelledById="mq-game-catalog-label-pick"
            showManualOption={false}
          />
        </>
      )}

      <div className="mqx-auth-monetka__actions">
        <Button
          type="button"
          mode="filled"
          stretched
          disabled={loading || busy || !selectedKey}
          onClick={handleStart}
          title="Начать игру с выбранным шаблоном"
        >
          {starting ? 'Запуск…' : 'Начать игру'}
        </Button>
        <Button
          type="button"
          mode="outline"
          stretched
          disabled={loading || busy || templates.length === 0}
          onClick={handleQuickStart}
          title="Сразу начать с самым простым сценарием"
        >
          {quickStarting ? 'Быстрый старт…' : 'Быстрый старт'}
        </Button>
        <Button type="button" mode="plain" stretched onClick={onBack} disabled={busy} title="Вернуться к выбору режима">
          Назад
        </Button>
      </div>
    </MonetkaBubbleScreen>
  );
}
