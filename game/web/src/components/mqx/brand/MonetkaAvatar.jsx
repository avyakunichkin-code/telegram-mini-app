import { monetkaAvatars } from './monetkaPoses';

export function MonetkaAvatar({ size = 40, pose = 'welcome', className = '' }) {
  return (
    <img
      className={['mqx-monetka-avatar', className].filter(Boolean).join(' ')}
      src={monetkaAvatars[pose] ?? monetkaAvatars.welcome}
      width={size}
      height={size}
      alt=""
    />
  );
}
