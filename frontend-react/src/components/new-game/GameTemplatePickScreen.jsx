import { useEffect, useState } from 'react';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../../api';
import { showNotification } from '../notifications';
import { MqxShell } from '../MqxShell';
import { MqxTabHero } from '../MqxTabHero';
import { GameStarterPicker } from '../GameStarterPicker';
import { DEFAULT_PERIOD_DURATION_SECONDS, normalizeStarterTemplate } from '../../config/gameDefaults';

/**
 * Шаг 2 (Game): только шаблоны каталога. Длительность периода — в `DEFAULT_PERIOD_DURATION_SECONDS`.
 */
export function GameTemplatePickScreen({ profileName, onBack, onJumpToGame }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await API.listGameTemplates();
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
    if (!profileName?.trim()) {
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
        profile_name: profileName.trim(),
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

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Новая игра"
          rightPill="Шаг 2"
          title="Шаблон игры"
          subtitle="Один тап по сценарию и старт партии. Длительность периода сейчас фиксируется в конфиге клиента."
        />
      }
    >
      <div className="mq-stack mq-stack--tight mq-stack-animate">
        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker">Профиль</div>
          <div className="mqx-card__title">{profileName.trim() || 'Без названия'}</div>
          <div className="mqx-card__sub">Режим: игра · тип сохранения менять нельзя.</div>
        </div>

        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker">Каталог</div>
          <div className="mqx-card__title">Стартовый сценарий</div>
          <div className="mqx-card__sub">Сложность по метке на карточке — от спокойного старта до высокого давления.</div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
              <Spinner />
            </div>
          ) : templates.length === 0 ? (
            <p className="mq-screen-intro" style={{ marginTop: 12 }}>
              Шаблоны не загрузились. Проверьте сеть и попробуйте вернуться позже.
            </p>
          ) : (
            <>
              <span id="mq-game-catalog-label-pick" className="mq-game-catalog-label">
                Выберите шаблон
              </span>
              <GameStarterPicker
                templates={templates}
                value={selectedKey}
                onChange={(key) => setSelectedKey(key == null ? null : String(key))}
                disabled={loading}
                labelledById="mq-game-catalog-label-pick"
                showManualOption={false}
              />
            </>
          )}

          <p className="mqx-card__sub" style={{ marginTop: 14, marginBottom: 0 }}>
            Длительность периода: <strong>{DEFAULT_PERIOD_DURATION_SECONDS} сек.</strong>{' '}
            <span style={{ opacity: 0.75 }}>
              Изменить: файл <code>frontend-react/src/config/gameDefaults.js</code>
            </span>
          </p>
        </div>

        <div className="mq-enter-item mq-actions-stack">
          <Button type="button" mode="filled" stretched disabled={loading || starting || !selectedKey} onClick={handleStart}>
            {starting ? 'Запуск…' : 'Начать игру'}
          </Button>
          <Button type="button" mode="outline" stretched onClick={onBack} disabled={starting}>
            Назад
          </Button>
        </div>
      </div>
    </MqxShell>
  );
}
