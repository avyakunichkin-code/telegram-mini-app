Поле ввода: подпись сверху, граница `mq-control-edge` (≥3:1), ошибка — край `mq-risk` + текст под полем.

**Когда:** вход и регистрация, суммы в формах (пополнить, вложить, погасить досрочно).

**Потребитель передаёт:** `label`, `value`, `onChange`, `error` (текст: что не так и как исправить), `inputMode="numeric"` для сумм, `autocomplete` для входа.

**Правила:** без shake на ошибку (shake — только риск-событие); вставка пароля разрешена (WCAG 3.3.8); placeholder — пример, не подпись.

**Prod:** `AuthFormField`, `.mq-field`, `InvestAmountControl`, `MqxLiabilityPrepayForm`.
