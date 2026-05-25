import { forwardRef } from 'react';

const VARIANT_CLASS = {
  'hero-filled': 'mqx-btn mqx-btn--filled',
  'hero-outline': 'mqx-btn mqx-btn--outline',
  primary: 'mqx-btn mqx-btn--primary',
  secondary: 'mqx-btn mqx-btn--secondary',
  ghost: 'mqx-btn mqx-btn--ghost',
  link: 'mqx-btn mqx-btn--link',
  destructive: 'mqx-btn mqx-btn--destructive',
};

/** Кнопка MQX — единственный CTA-примитив в user flows (вместо TGUI Button). */
export const MqxButton = forwardRef(function MqxButton(
  {
    variant = 'hero-outline',
    size = 'default',
    stretched = false,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  const base = VARIANT_CLASS[variant] ?? VARIANT_CLASS['hero-outline'];
  const cls = [
    base,
    size === 'compact' && 'mqx-btn--compact',
    stretched && 'mqx-btn--stretched',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button ref={ref} type={type} className={cls} {...props} />;
});
