# Финансы как игра · дизайн приложения

<!-- design-canon:start -->
Актуальное направление — **«Финансы как игра»**, ревизия 1.

| Экран | Область | Статус | Ревизия | Превью | Утверждение | Реализация | Проверка канона |
|---|---|---|---|---|---|---|---|
| Стартовые экраны | Игра · компактный вид | Подключено к игре | 1 | [Lab](../../design-lab/start-flow-concept-round/README.md) | [Решение](../../design-lab/start-flow-concept-round/APPROVED.md) | [Код](../../web/src/components/mqx/pregame/MqxStartFlow.jsx) | [Проверка](../../web/e2e/onboarding.spec.js) |
| Главная | Игра · компактный вид | Подключено к игре | 1 | [Lab](../../design-lab/finance-game-round/compact.html) | [Решение](../../design-lab/dashboard/APPROVED.md) | [Код](../../web/src/components/DashboardPremium.jsx) | [Проверка](../../web/scripts/check-dashboard-canon.mjs) |
| Капитал | Игра · компактный вид | Подключено к игре | 1 | [Lab](../../design-lab/finance-game-round/capital-preview.html) | [Решение](../../design-lab/capital-page/APPROVED.md) | [Код](../../web/src/components/FinancePremium.jsx) | [Проверка](../../web/scripts/check-finance-canon.mjs) |
| Аналитика | Игра · компактный вид | Подключено к игре | 1 | [Lab](../../design-lab/finance-game-round/analytics-preview.html) | [Решение](../../design-lab/analytics/APPROVED.md) | [Код](../../web/src/components/AnalyticsPremium.jsx) | — |
| Меню | Игра · компактный вид | Подключено к игре | 1 | [Lab](../../design-lab/finance-game-round/menu-preview.html) | [Решение](../../design-lab/finance-game-round/MENU_APPROVED.md) | [Код](../../web/src/components/MenuPremium.jsx) | — |
| Широкий веб-вид | Игра · широкий веб-вид | Подключено к игре | 1 | [Lab](../../design-lab/finance-game-round/desktop-preview.html) | [Решение](../../design-lab/finance-game-round/DESKTOP_APPROVED.md) | [Код](../../web/src/components/mqx/layout/MqxWideDashboard.jsx) | [Проверка](../../web/e2e/desktop-wide.spec.js) |
| Лендинг «Финансы как игра» | Лендинг | На рассмотрении | — | [Lab](../../design-lab/landing-finance-game/index.html) | — | — | — |

| Общий элемент | Источник | Область | Подключение | Потребитель | Превью |
|---|---|---|---|---|---|
| Логотип | [Источник](assets/Logos/README.md) | Игра · компактный вид | Общий | [Потребитель](../../web/src/components/BrandLogo.jsx) | — |
| Логотип | [Источник](assets/Logos/README.md) | Игра · широкий веб-вид | Общий | [Потребитель](../../web/src/components/GameScreenLayout.jsx) | — |
| Логотип | [Источник](assets/Logos/README.md) | Лендинг | Согласованный вариант | [Потребитель](../../landing/site/index.html) | [Lab](../../design-lab/landing-finance-game/index.html) |
| Студент | [Источник](assets/Characters/landing-v3/student-introduce.webp) | Игра · компактный вид | Общий | [Потребитель](../../web/src/components/mqx/brand/personaPortraits.js) | [Lab](../../design-lab/landing-finance-game/student-portrait-concept.png) |
| Студент | [Источник](assets/Characters/landing-v3/student-introduce.webp) | Игра · широкий веб-вид | Согласованный вариант | [Потребитель](../../web/src/assets/menu/student-campus.png) | — |
| Студент | [Источник](assets/Characters/landing-v3/student-introduce.webp) | Лендинг | Согласованный вариант | [Потребитель](../../landing/site/assets/student-board.png) | — |
| Завершить ход | [Источник](runtime/styles/mqx/layout.css) | Игра · компактный вид | Общий | [Потребитель](../../web/src/components/mqx/layout/MqxDashboardHero.jsx) | — |
| Завершить ход | [Источник](runtime/styles/mqx/layout.css) | Игра · широкий веб-вид | Общий | [Потребитель](../../web/src/components/mqx/layout/MqxWideDashboard.jsx) | — |
<!-- design-canon:end -->

## Решения по деталям

Источник решений — [«Спроектировать браузерную игру»](https://chatgpt.com/s/cx_6af8ba4f30f08191b87c60c738007620). В чате зафиксированы выбор и внедрение в прежней рабочей копии. Ниже указано состояние в текущей ветке.

| Область | Утверждено | Текущая ветка |
|---|---|---|
| Помощь Монетки | Вариант Б: Монетка в верхнем блоке, контекстная помощь по нажатию, без разделяющей строки и сдвига при получении зарплаты. Эмоции соответствуют зарплате, событиям, готовности завершить ход и финансовому риску. | Подсказка открывается в диалоге из верхнего блока. Используется утверждённый объёмный аватар. Набор эмоций ещё предстоит восстановить. |
| Старт | Гостевой старт А «Твои решения. Твой финансовый опыт». Короткое обучение первого хода и добровольное закрепление партии за аккаунтом после первого итога. | Гостевой старт подключён в оформлении B. Игрок может продолжить существующую гостевую партию и закрепить её за аккаунтом. |
| Иллюстрации ролей | Утверждённые портреты v3 с лендинга | В игре подключены обычные портреты всех четырёх ролей. Победные иллюстрации с кубком используют прежний набор. |

Для широкой веб-Главной ориентиром служит исходное MQX-превью из таблицы: верхняя навигация, две колонки и завершение хода с прогнозом над потребностями. Статус в таблице относится к реализации в этой рабочей копии.

## Совместимость действующих компонентов

Pocket Board и InkEdge описывают существующие реализации и предыдущие итерации. В витринах показываем игровые снимки или действующие компоненты с указанием источника.

Редактируемый runtime CSS находится в `game/design/system/runtime/`. Пути `game/web/src/index.css` и `game/web/src/styles/` — его проверяемые экспорты. Иллюстрации ролей v3 находятся в `assets/Characters/landing-v3/`, объёмная Монетка и аватар — в `assets/Monetka/`.

## Цепочка источников

1. `runtime/styles/tokens.css` — токены «Чернильного края»: `--mq-ink-w`, `--mq-ink-line`, `--mq-ink-drop`, `--mq-ink-off`, `--mq-ink-off-s` (в тёмной теме край и тень — `--mq-board-ink-faint`). Те же токены — в `tokens.json` дизайн-системы.
2. `runtime/styles/mqx/*.css` — правила стиля в CSS своего блока: `board.css` (Главная), `finance.css` (Капитал, листы и подтверждение — последним разделом файла), `events.css`, `juice.css` (итог хода), `analytics.css`, `menu.css` (игровое Меню), `pregame.css` (стартовые экраны), `run-finale.css`, `guidance.css` (подсказка онбординга), `shell.css` (таббар).
3. [Историческое утверждение InkEdge](../../design-lab/board-game/APPROVED.md) описывает прежние правила (обводка, цветная и чернильная тень, одна рамка на уровень) и ход согласования: выбранный A, карта хода K1, окна `ink-sheets-round`, доработка и ★ по `ink-decision-round`.
4. В этой дизайн-системе — [архив InkEdge](../archive/ink-edge-2026-11/README.md), классы `.th-ink` в `components/bundle.css`: те же правила на примерах `th-*`.

До 2026-11-02 стиль был пробным слоем `styles/mqx/ink.css` под `:root[data-mqx-style='ink']` с переключателем `utils/mqxStyle.js`; слой влит в CSS блоков, переключатель удалён.

## Превью и лендинг

[Архивное превью InkEdge](../archive/ink-edge-2026-11/ink-preview.html) сохраняет примеры прежней подачи.

## Логотип «Твой ход»

Утверждённый знак для направления «Финансы как игра» — золотой двухстрочный логотип со сливовой основой и подписью на золотой ленте. Исходник и форматы находятся в [библиотеке логотипов](assets/Logos/README.md). Образцы доступны в витрине элементов и каталоге MQX.

## Элементы «Финансы как игра»

[Витрина элементов](../../design-lab/finance-game-round/elements.html) и [правила композиции](../../design-lab/finance-game-round/README.md) фиксируют набор для переноса в дизайн-систему. На Главной кнопки «Завершить ход» и доступная «Зарплата» используют общий фон `--mq-pocket-gold`. После выплаты показываем приглушённое состояние. Обрезанные иконки действий из `assets/Actions/` центрируются по видимой области вместе с текстом.

Потребности представлены четырьмя подписанными шкалами в один ряд. Толщина шкал 10 px. Красный цвет соответствует значениям ниже 60%, оранжевый — от 60%, зелёный — от 80%. Предупреждение о поражении определяется игровыми правилами. Исходные стили находятся в `runtime/styles/mqx/board.css`, иконки в `assets/Needs/`.

## Роли кнопок MQX

[Утверждённый вариант А](../../design-lab/mqx-component-library/APPROVED.md) закрепляет золотой вариант `MqxButton variant="turn"` за завершением хода и доступной зарплатой. Для основных действий внутри экранов и форм используется фиолетовый `primary`, для второстепенных — `secondary`. Примеры доступны в каталоге `#/dev/mqx`.
