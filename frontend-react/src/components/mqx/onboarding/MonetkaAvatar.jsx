import monetkaDefaultPng from '../../../assets/monetka-mascot.png';
import monetkaDefaultWebp from '../../../assets/monetka-mascot.webp';
import monetkaSitEdgePng from '../../../assets/monetka-poses/monetka-sit-edge.png';
import monetkaSitEdgeWebp from '../../../assets/monetka-poses/monetka-sit-edge.webp';

const POSE_SRC = {
  default: { webp: monetkaDefaultWebp, png: monetkaDefaultPng },
  'sit-edge': { webp: monetkaSitEdgeWebp, png: monetkaSitEdgePng },
};

/**
 * @param {'default' | 'sit-edge'} [pose]
 * sit-edge — сидит на краю блока, ноги свисают (PNG/WebP с alpha).
 */
export function MonetkaAvatar({ size = 72, className = '', pose = 'default' }) {
  const assets = POSE_SRC[pose] ?? POSE_SRC.default;
  const sitEdge = pose === 'sit-edge';

  return (
    <picture>
      <source srcSet={assets.webp} type="image/webp" />
      <img
        src={assets.png}
        alt=""
        aria-hidden="true"
        width={sitEdge ? undefined : size}
        height={sitEdge ? undefined : size}
        className={[
          'mqx-onboarding-monetka',
          sitEdge && 'mqx-onboarding-monetka--sit-edge',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          sitEdge
            ? { width: size, maxWidth: '34vw', height: 'auto', minWidth: 0 }
            : undefined
        }
        draggable={false}
        decoding="async"
      />
    </picture>
  );
}
