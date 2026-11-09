import { BottomGameNav } from './BottomGameNav';
import { MqxPocketNavigation } from './mqx/layout/MqxPocketBoard';

/**
 * Оболочка игрового экрана: скролл только в main, таббар в потоке документа (не fixed).
 */
export function GameScreenLayout({ moodClass = '', overlays = null, children, tabNav = null }) {
  return (
    <div className={`app-shell mq-page mq-game-shell mq-game-shell--pocket ${moodClass}`.trim()}>
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-page__grain" aria-hidden />
      {overlays}
      {/* Не <main>: ориентир main — у скролла вкладки (*Premium), вложенный main сбивал скринридер. */}
      <div className="mq-game-shell__main">{children}</div>
      {tabNav}
    </div>
  );
}

export function GameScreenTabNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <MqxPocketNavigation><BottomGameNav activeTab={activeTab} setActiveTab={setActiveTab} lockTabs={lockTabs} /></MqxPocketNavigation>
  );
}
