const VARIANT_CLASS = {
  default: '',
  goal: 'mqx-card--goal',
  character: 'mqx-card--character',
};

/**
 * Оболочка карточки MQX (glass, radius 16px).
 * @param {'section'|'article'|'div'} as
 */
export function MqxCard({
  as: Component = 'section',
  variant = 'default',
  className = '',
  id,
  'aria-labelledby': ariaLabelledBy,
  children,
}) {
  const variantClass = VARIANT_CLASS[variant] || '';
  const classes = ['mqx-card', variantClass, className].filter(Boolean).join(' ');

  return (
    <Component className={classes} id={id} aria-labelledby={ariaLabelledBy}>
      {children}
    </Component>
  );
}
