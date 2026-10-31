Кнопка MQX — единственный CTA-примитив: `primary` (ход), `secondary`, `ghost`, `destructive`, `link`; состояния disabled и busy.

**Когда:** `primary` — одно главное действие экрана, прежде всего «Завершить ход». `secondary` — альтернатива рядом. `ghost`/`link` — «Назад», «Подробнее». `destructive` — только когда теряются деньги или прогресс.

**Потребитель передаёт:** `children` (глагол: «Завершить ход», «Забрать зарплату»), `variant`, `stretched` (на всю ширину), `disabled` с причиной рядом текстом, `onClick`.

**Поведение:** нажатие — опускание на lift за `mq-dur-press`. Спиннер (`busy`) — только если ответ дольше 300 мс. Хит-зона ≥ `mq-tap`.

**Нельзя:** две `primary` на экране; «ОК», «Далее», «Подтвердить» без объекта; disabled без объяснения почему.

**Prod:** `MqxButton` (`components/mqx/primitives/MqxButton.jsx`), `variant`: `primary | secondary | ghost | link | destructive | hero-filled | hero-outline` (два hero — legacy v1), `size="compact"`, `stretched`.
