import { useState } from 'react';
import { BottomGameNav } from '../../BottomGameNav';
import { MqxMenuPage } from '../layout/MqxMenuPage';


const SAVE = { templateKey: 'mq_game_basic_v1', turn: '08', persona: 'Студент', cash: 42000, goal: 'собрать подушку' };
const TAB_LABELS = { dashboard: 'Главная', finance: 'Капитал', analytics: 'Аналитика' };

export function MqxMenuPreview() {
  const [notice, setNotice] = useState('');
  const show = (label) => () => setNotice(label);

  return (
    <div className="app-shell mqx-menu-preview">
      <MqxMenuPage
        save={SAVE}
        savesHint="3 партии"
        onContinue={show('Продолжить игру → Главная')}
        onNewGame={show('Новая игра → Выбор персонажа')}
        onLoadGame={show('Все сохранения → Список партий')}
        onLogout={show('Выйти из аккаунта → Вход')}
      />
      <div className="mqx-menu-preview__notice" role="status">{notice}</div>
      <BottomGameNav
        activeTab="menu"
        setActiveTab={(tab) => setNotice(TAB_LABELS[tab] ?? '')}
      />
    </div>
  );
}
