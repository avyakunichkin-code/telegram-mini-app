import { useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../../api';
import { showNotification } from '../../components/notifications';
import { MqxStarterScenarioPicker } from '../../components/mqx/layout/MqxStarterScenarioPicker';
import { MqxBoardButton } from '../../components/mqx/pregame/MqxBoardButton';
import { lifeStartLabel } from '../../components/mqx/utils/pregameDisplay';
import { normalizeStarterTemplate } from '../../config/gameDefaults';

/**
 * Выбор жизни ★ BG-2: «Новая игра» ведёт сюда сразу (шага «Игра / План» нет — ADR-013).
 * Карточка выбирает персонажа, старт — кнопкой «Начать за …». Название сохранения — авто.
 */
export function GameTemplatePickScreen({ profileName, onBack, onJumpToGame }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await API.listGameTemplates('game');
        if (cancelled) return;
        const list = (Array.isArray(rows) ? rows : []).map(normalizeStarterTemplate).filter(Boolean);
        setTemplates(list);
        setSelectedKey(list.length ? list[0].template_key : null);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = templates.find((t) => t.template_key === selectedKey) || null;

  const handleStart = async () => {
    const name = profileName?.trim();
    if (!selected || !name || starting) return;
    setStarting(true);
    try {
      await API.startNewGame({ profile_name: name, save_kind: 'game', template_key: selected.template_key });
      onJumpToGame();
    } catch (error) {
      showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
      setStarting(false);
    }
  };

  return (
    <div className="mqx-pg">
      <header className="mqx-pg-head">
        <h1 id="mqx-life-pick-title">Выбери жизнь</h1>
        <small>У каждой свой старт и своя цель</small>
      </header>

      {loading ? (
        <div className="mqx-pg-state" role="status">
          <Spinner size="m" />
          <span>Раскладываю фишки…</span>
        </div>
      ) : templates.length === 0 ? (
        <p className="mqx-pg-state" role="alert">
          {loadFailed ? 'Не удалось загрузить персонажей. Проверь сеть и попробуй позже.' : 'Персонажей пока нет.'}
        </p>
      ) : (
        <MqxStarterScenarioPicker
          templates={templates}
          value={selectedKey}
          onChange={setSelectedKey}
          disabled={starting}
          labelledById="mqx-life-pick-title"
        />
      )}

      {selected ? (
        <button type="button" className="mqx-bg-btn mqx-bg-cta mqx-pg-cta" onClick={handleStart} disabled={starting}>
          {starting ? 'Начинаем…' : lifeStartLabel(selected.title)}
        </button>
      ) : null}

      <MqxBoardButton variant="link" onClick={onBack} disabled={starting}>
        Назад
      </MqxBoardButton>
    </div>
  );
}
