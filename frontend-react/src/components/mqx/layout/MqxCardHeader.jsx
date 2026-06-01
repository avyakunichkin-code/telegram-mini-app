const KICKER_TONE_CLASS = {
  default: '',
  emerald: 'mqx-card__kicker--emerald',
  violet: 'mqx-card__kicker--violet',
  amber: 'mqx-card__kicker--amber',
  sky: 'mqx-card__kicker--sky',
};

/**
 * Шапка карточки: kicker + заголовок + подзаголовок + слот справа (badge, chip).
 * layout: stack — kicker сверху; split — заголовок слева, trailing справа (цели).
 */
export function MqxCardHeader({
  kicker,
  kickerTone = 'default',
  title,
  titleId,
  sub,
  trailing,
  layout = 'stack',
}) {
  const kickerClass = ['mqx-card__kicker', KICKER_TONE_CLASS[kickerTone]].filter(Boolean).join(' ');

  if (layout === 'split') {
    return (
      <div className="mqx-goal__top">
        <div>
          {kicker ? <div className={kickerClass}>{kicker}</div> : null}
          {title ? (
            <div className="mqx-card__title" id={titleId}>
              {title}
            </div>
          ) : null}
          {sub ? <p className="mqx-card__sub">{sub}</p> : null}
        </div>
        {trailing}
      </div>
    );
  }

  return (
    <>
      {kicker ? <div className={kickerClass}>{kicker}</div> : null}
      {title || trailing ? (
        <div className={trailing ? 'mqx-character__top' : undefined}>
          <div>
            {title ? (
              <div className="mqx-card__title" id={titleId}>
                {title}
              </div>
            ) : null}
            {sub ? <p className="mqx-card__sub">{sub}</p> : null}
          </div>
          {trailing}
        </div>
      ) : null}
    </>
  );
}
