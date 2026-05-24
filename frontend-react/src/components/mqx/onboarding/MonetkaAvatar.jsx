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
 * sit-edge — сидит на краю блока, ноги свисают (WebP + alpha, PNG fallback).
 */
export function MonetkaAvatar({ size = 72, className = '', pose = 'default' }) {
  const { webp, png } = POSE_SRC[pose] ?? POSE_SRC.default;
  const sitEdge = pose === 'sit-edge';
  const imgClass = [
    'mqx-onboarding-monetka',
    sitEdge && 'mqx-onboarding-monetka--sit-edge',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      <img
        src={png}
        alt=""
        aria-hidden="true"
        width={sitEdge ? undefined : size}
        height={sitEdge ? undefined : size}
        className={imgClass}
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
