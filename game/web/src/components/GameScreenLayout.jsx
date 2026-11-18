import { BottomGameNav } from './BottomGameNav';
import { BrandLogo } from './BrandLogo';

/**
 * Оболочка игрового экрана: скролл только в main, таббар в потоке документа (не fixed).
 */
export function GameScreenLayout({ moodClass = '', overlays = null, children, tabNav = null, wideTurn = null }) {
  const wide = wideTurn !== null;
  return (
    <div className={`app-shell mq-page mq-game-shell ${wide ? 'mqx-wide mqx-wide--game' : ''} ${moodClass}`.trim()}>
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-page__grain" aria-hidden />
      {overlays}
      {wide && (
        <header className="mqx-wide__header">
          <BrandLogo variant="finance-game" />
          {tabNav}
          <strong className="mqx-wide__turn">Ход {wideTurn}</strong>
        </header>
      )}
      {/* Не <main>: ориентир main — у скролла вкладки (*Premium), вложенный main сбивал скринридер. */}
      <div className="mq-game-shell__main">{children}</div>
      {!wide && tabNav}
    </div>
  );
}

export function GameScreenTabNav({ activeTab, setActiveTab, lockTabs = false }) {
  return (
    <BottomGameNav activeTab={activeTab} setActiveTab={setActiveTab} lockTabs={lockTabs} />
  );
}
