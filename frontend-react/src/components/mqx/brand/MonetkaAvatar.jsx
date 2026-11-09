import { getGuideMascot } from './guideMascots';

/** Approved A. Small slots use a face crop; sit-edge is a compatibility alias for welcome. */
export function MonetkaAvatar({ size = 72, className = '', pose = 'default', full = false }) {
  const selected = pose === 'default' || pose === 'sit-edge' ? 'welcome' : pose;
  const sitEdge = pose === 'sit-edge';
  const art = getGuideMascot('coin', selected, !full && !sitEdge && size <= 48);
  return (
    <picture data-mascot="monetka" data-pose={selected}>
      <source type="image/webp" srcSet={art.webp} />
      <img src={art.png} alt="" aria-hidden="true" width={size} height={size}
        className={['mqx-onboarding-monetka', sitEdge && 'mqx-onboarding-monetka--sit-edge', className].filter(Boolean).join(' ')}
        style={sitEdge ? { width: size, maxWidth: '34vw', height: 'auto', minWidth: 0 } : undefined}
        draggable={false} decoding="async" />
    </picture>
  );
}
