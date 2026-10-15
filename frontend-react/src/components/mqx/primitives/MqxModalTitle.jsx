import { Drawer } from '@xelene/vaul-with-scroll-fix';

/**
 * Заголовок окна `Modal` из telegram-ui, связанный с Radix Dialog (aria-labelledby).
 * Без него Radix пишет в консоль «DialogContent requires a DialogTitle», а скринридер
 * не объявляет окно. Рендерит обычный `<h2>` с переданными классами.
 * Свой `id` не передавать: при `asChild` он перебьёт id Radix, и `aria-labelledby` окна
 * будет указывать в пустоту.
 */
export function MqxModalTitle({ children, className }) {
  return (
    <Drawer.Title asChild>
      <h2 className={className}>
        {children}
      </h2>
    </Drawer.Title>
  );
}

/** Описание окна (aria-describedby). Окну без описания передай `aria-describedby={undefined}` в `Modal`. */
export function MqxModalDescription({ children, className }) {
  return (
    <Drawer.Description asChild>
      <p className={className}>{children}</p>
    </Drawer.Description>
  );
}
