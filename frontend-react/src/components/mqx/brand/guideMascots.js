const files = import.meta.glob('../../../assets/guides/*.{png,webp}', { eager: true, query: '?url', import: 'default' });
export const MONETKA_POSES = ['welcome', 'wink', 'surprised', 'think', 'joy', 'worried', 'victory'];
export const KVITYA_POSES = ['default', 'joy', 'think'];

export function getGuideMascot(kind, pose, avatar = false) {
  const poses = kind === 'coin' ? MONETKA_POSES : KVITYA_POSES;
  const selected = poses.includes(pose) ? pose : poses[0];
  const stem = `${kind}-${selected}${kind === 'coin' && avatar ? '-avatar' : ''}`;
  return { png: files[`../../../assets/guides/${stem}.png`], webp: files[`../../../assets/guides/${stem}.webp`] };
}
