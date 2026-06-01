import { BottomGameNav } from './BottomGameNav';

/**
 * Оболочка игрового экрана: скролл только в main, таббар в потоке документа (не fixed).
 */
export function GameScreenLayout({ moodClass = '', overlays = null, children, tabNav = null }) {
  return (
    <div className={`app-shell mq-page mq-game-shell ${moodClass}`.trim()}>
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-page__grain" aria-hidden />
      {overlays}
      <main className="mq-game-shell__main">{children}</main>
      {tabNav}
    </div>
  );
}

export function GameScreenTabNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <BottomGameNav activeTab={activeTab} setActiveTab={setActiveTab} lockTabs={lockTabs} />
  );
}
