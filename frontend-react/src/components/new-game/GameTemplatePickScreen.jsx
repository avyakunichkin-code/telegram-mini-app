import { useEffect, useState } from 'react';
import { Button, Input, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../../api';
import { showNotification } from '../notifications';
import { MqxShell } from '../MqxShell';
import { MqxTabHero } from '../MqxTabHero';
import { GameStarterPicker } from '../GameStarterPicker';

/**
 * Шаг 2 (Game): только шаблоны каталога + темп периода. Ручной сценарий — через будущий Plan.
 */
export function GameTemplatePickScreen({ profileName, onBack, onJumpToGame }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [periodSeconds, setPeriodSeconds] = useState(300);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await API.listGameTemplates();
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setTemplates(list);
        setSelectedKey(list.length ? list[0].template_key : null);
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

  const handleStart = async (e) => {
    e.preventDefault();
    if (!profileName?.trim()) {
      showNotification('Нет названия профиля — вернитесь назад.', 'error');
      return;
    }
    if (!selectedKey) {
      showNotification('Выберите шаблон старта', 'error');
      return;
    }
    if (periodSeconds < 10) {
      showNotification('Длительность периода не менее 10 секунд', 'error');
      return;
    }
    setStarting(true);
    try {
      await API.startNewGame({
        profile_name: profileName.trim(),
        save_kind: 'game',
        template_key: selectedKey,
        period_duration_seconds: periodSeconds,
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
          subtitle="Один тап по сценарию — и можно начинать период. Пользовательский ввод будет в режиме «План»."
        />
      }
    >
      <form onSubmit={handleStart} className="mq-stack mq-stack--tight mq-stack-animate">
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
                onChange={setSelectedKey}
                disabled={loading}
                labelledById="mq-game-catalog-label-pick"
                showManualOption={false}
              />
            </>
          )}

          <div className="mqx-form" style={{ marginTop: 16 }}>
            <Input
              header="Длительность периода (сек)"
              type="number"
              value={periodSeconds}
              min={10}
              onChange={(e) => setPeriodSeconds(Number(e.target.value))}
              placeholder="300"
            />
          </div>
        </div>

        <div className="mq-enter-item mq-actions-stack">
          <Button type="submit" mode="filled" stretched disabled={loading || starting || !selectedKey}>
            {starting ? 'Запуск…' : 'Начать игру'}
          </Button>
          <Button type="button" mode="outline" stretched onClick={onBack} disabled={starting}>
            Назад
          </Button>
        </div>
      </form>
    </MqxShell>
  );
}
