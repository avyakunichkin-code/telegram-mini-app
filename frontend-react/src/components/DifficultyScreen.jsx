import { useEffect, useState } from 'react';
import { Button, Input, Select, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';
import { GameStarterPicker } from './GameStarterPicker';

export function DifficultyScreen({ onNext, onBack, onJumpToGame }) {
  const [profileName, setProfileName] = useState('');
  const [saveKind, setSaveKind] = useState('game');
  const [periodDuration, setPeriodDuration] = useState(300);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [startingFromTemplate, setStartingFromTemplate] = useState(false);
  /** Выбранный ключ шаблона или null — ручной ввод на следующем шаге (только save_kind game) */
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- локальный флаг загрузки шаблонов при смене saveKind */
    if (saveKind !== 'game') {
      setTemplatesLoading(false);
      return undefined;
    }

    let cancelled = false;
    setTemplatesLoading(true);
    (async () => {
      try {
        const rows = await API.listGameTemplates();
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateKey(list[0].template_key);
        } else {
          setSelectedTemplateKey(null);
        }
      } catch {
        if (!cancelled) {
          setTemplates([]);
          setSelectedTemplateKey(null);
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [saveKind]);

  const handleSaveKindChange = (next) => {
    setSaveKind(next);
    if (next === 'plan') setSelectedTemplateKey(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showNotification('Введите название профиля', 'error');
      return;
    }
    if (periodDuration < 10) {
      showNotification('Длительность периода должна быть не менее 10 секунд', 'error');
      return;
    }
    const template_key = saveKind === 'game' ? selectedTemplateKey : null;
    const skipBaseParams =
      saveKind === 'game' && template_key != null && !templatesLoading && typeof onJumpToGame === 'function';

    if (skipBaseParams) {
      setStartingFromTemplate(true);
      try {
        await API.startNewGame({
          profile_name: profileName.trim(),
          save_kind: 'game',
          template_key,
          period_duration_seconds: periodDuration,
        });
        onJumpToGame();
      } catch (error) {
        showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
      } finally {
        setStartingFromTemplate(false);
      }
      return;
    }

    onNext({
      profile_name: profileName.trim(),
      save_kind: saveKind,
      template_key,
      period_duration_seconds: periodDuration,
    });
  };

  const canStartFromTemplate =
    saveKind === 'game' && selectedTemplateKey != null && !templatesLoading && typeof onJumpToGame === 'function';

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Новая игра"
          rightPill={canStartFromTemplate ? 'Старт из шаблона' : 'Шаг 1/2'}
          title="Старт и темп"
          subtitle="Игра с шаблоном можно начать сразу; ручной старт и план открывают шаг с параметрами."
        />
      }
    >
      <form onSubmit={handleSubmit} className="mq-stack mq-stack--tight mq-stack-animate">
        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker">Сохранение</div>
          <div className="mqx-card__title">Параметры</div>
          <div className="mqx-card__sub">Тип сохранения задаётся один раз и дальше не меняется.</div>

          <div className="mqx-form" style={{ marginTop: 14 }}>
            <Input
              header="Название сохранения"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Мой первый профиль"
              required
            />
            <Select header="Тип сохранения" value={saveKind} onChange={(e) => handleSaveKindChange(e.target.value)}>
              <option value="game">Игра — симулятор с шаблоном или своим стартом</option>
              <option value="plan">План — своя экономика без игровых шаблонов</option>
            </Select>
            {saveKind === 'game' ? (
              templatesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <Spinner />
                </div>
              ) : (
                <>
                  <span id="mq-game-catalog-label" className="mq-game-catalog-label">
                    Каталог стартов
                  </span>
                  <GameStarterPicker
                    templates={templates}
                    value={selectedTemplateKey}
                    onChange={setSelectedTemplateKey}
                    disabled={templatesLoading}
                    labelledById="mq-game-catalog-label"
                  />
                </>
              )
            ) : (
              <p className="mq-screen-intro" style={{ marginTop: 4 }}>
                Шаг 2: кошелёк, зарплата, активы и долги — только ваши значения.
              </p>
            )}
            <Input
              header="Длительность периода (сек)"
              type="number"
              value={periodDuration}
              onChange={(e) => setPeriodDuration(Number(e.target.value))}
              placeholder="300"
            />
          </div>

          <div className="mq-actions-stack" style={{ marginTop: 16 }}>
            <Button
              type="submit"
              mode="filled"
              stretched
              disabled={(saveKind === 'game' && templatesLoading) || startingFromTemplate}
            >
              {startingFromTemplate
                ? 'Запуск...'
                : canStartFromTemplate
                  ? 'Начать игру'
                  : 'Далее: базовые параметры'}
            </Button>
            <Button type="button" mode="outline" stretched onClick={onBack}>
              Назад
            </Button>
          </div>
        </div>
      </form>
    </MqxShell>
  );
}
