/**
 * Единый «таб-хиро» для потоков вне игрового дашборда: MQ‑пилюли, заголовок, подзаголовок.
 * Совпадает с экранами «Профили», «Финансы», «Аналитика», старт игры и авторизация.
 */
export function MqxTabHero({
  sectionLabel,
  rightPill = null,
  title,
  subtitle = null,
  titleClassName = 'mqx-hero__title--tab',
  subtitleClassName = '',
  heroClassName = '',
}) {
  return (
    <header className={`mqx-hero mqx-hero--tab ${heroClassName}`.trim()}>
      <div className="mqx-hero__glow" aria-hidden />
      <div className="mqx-hero__top">
        <div className="mqx-hero-pills">
          <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
          <span className="mqx-hero-pill">{sectionLabel}</span>
        </div>
        {rightPill ? <span className="mqx-hero-pill mqx-hero-pill--ghost">{rightPill}</span> : null}
      </div>
      <div className={`mqx-hero__title ${titleClassName}`.trim()}>{title}</div>
      {subtitle ? (
        <div className={`mqx-hero__sub ${subtitleClassName}`.trim()}>{subtitle}</div>
      ) : null}
    </header>
  );
}
