import monetkaAvatar from '../../../assets/monetka/monetka-soft-volume-avatar.webp';

export function MonetkaAvatar({ size = 40, className = '' }) {
  return (
    <img
      className={['mqx-monetka-avatar', className].filter(Boolean).join(' ')}
      src={monetkaAvatar}
      width={size}
      height={size}
      alt=""
    />
  );
}
