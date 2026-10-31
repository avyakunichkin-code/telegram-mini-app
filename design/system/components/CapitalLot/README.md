Карточка собственности: цветная полоса говорит, что это, строки — позиции со суммой и текстовым действием.

**Когда:** вкладка «Капитал · Детали». Тон: `invest` — золото, `property` — изумруд, `insure` — фиолетовый, `debt` — красный (только долги). Пусто — одна строка `CapitalLotNote`; закрыто — `locked` (пунктир, «Откроется на шаге …»).

**Потребитель передаёт:** `tone`, `title`, `meta` (итог раздела), строки `CapitalLotRow {title, value, note, actions}`, действия `CapitalLotAction` («Продать», «Погасить», «Закрыть»).

**Порядок разделов:** Доходы → Расходы → Инвестиции → Страховки → Имущество → Обязательства.

**Prod:** `CapitalLot`, `CapitalLotRow`, `CapitalLotAction`, `CapitalLotNote` (`components/mqx/layout/CapitalLot.jsx`).
