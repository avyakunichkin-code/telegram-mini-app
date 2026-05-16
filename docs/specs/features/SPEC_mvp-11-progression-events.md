---
layer: spec
status: approved
owner: product
last_reviewed: 2026-05-17
tracks: progression, events-levels, xp, mvp-1-1
idea: ../../vision/ideas/mvp-1-1-product-direction.md
foundation: ../../foundation/TARGET_PLAYER_AND_SESSION.md
progression_design: ../../specs/gameplay/LEVEL_XP_SYSTEM.md
xp_matrix: ../../specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md
plan_progression: ../../plans/PLAN_level-xp-progression.md
plan: ../../plans/PLAN_mvp-11-progression-events.md
---

# Spec: MVP 1.1 — события по уровню, прокачка персонажа, связка UX

Спецификация **полного вертикального среза** после эпика G1: события **привязаны к системе уровней персонажа** (окно выпадания как в части II концепции), расширение **эффектов выборов событий** (XP и при необходимости дельта «жизни»), выведение **числового уровня и XP профиля** в API и главный игровой UI, техническое объединение **дублирующегося расчёта XP** из роутов и конца периода.

Читать вместе с:

- [`mvp-1-1-product-direction`](../../vision/ideas/mvp-1-1-product-direction.md)
- [`TARGET_PLAYER_AND_SESSION`](../../foundation/TARGET_PLAYER_AND_SESSION.md)
- [`money-quest-evolution-after-mvp §II`](../../vision/ideas/money-quest-evolution-after-mvp.md)
- **[`LEVEL_XP_SYSTEM`](../../specs/gameplay/LEVEL_XP_SYSTEM.md)** — модель уровней, разблокировки, темп, система начисления
- **[`XP_EVENTS_ACTIONS_MATRIX`](../../specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md)** — перечень действий API и событий с XP
- **[`PLAN_level-xp-progression`](../../plans/PLAN_level-xp-progression.md)** — фазы после MVP 11 (константы, гейты, UX-баланс)

---

## 1. Принятые решения продукта (уточнение 2026-05-17)

| Вопрос | Решение |
|--------|---------|
| Отбор событий | **`event_tier`** на определении; окно выпадания: \(\texttt{event\_tier} \in [\max(1,\, L-2),\; L]\), где \(L = \texttt{GameProfile.level}\). Плюс существующий фильтр **`mode`** \(\sim\) **`save_kind`**. |
| Повторы | Контент **по умолчанию repeatable** в первой волне; **в БД и бекенде** колонка **`repeat_policy`** + исключение при **`once_per_profile`** (архитектурная готовность). |

---

## 2. Objective

### 2.1. Зачем (Why)

Эскалация контента при росте уровня, возврат к игре через **видимые уровень/XP**, согласованность с дорожкой «события × прокачка» из [`mvp-1-1-product-direction`](../../vision/ideas/mvp-1-1-product-direction.md).

### 2.2. Кто (Who)

Игрок **Game Mode** (новички и экспериментаторы — см. [`TARGET_PLAYER_AND_SESSION`](../../foundation/TARGET_PLAYER_AND_SESSION.md)).

### 2.3. Success criteria

1. `ensure_period_events` применяет окно **`event_tier`** и фильтры §6 при наличии кандидатов; есть **цепочка fallback** если кандидатов мало.
2. **`GET /api/finance/overview`** отдаёт **`character_*`** поля RPG-прогресса отдельно от `gamification_level`/`score`/`xp_to_next_level`.
3. `effects_json` на выборе события поддерживает **`xp_delta`** через **единую** функцию повышения уровня §5.
4. Рефакторинг дубля логики XP из `period_actions.py` и `game_period.py` §11.
5. Волна сидов: **≥12** событий, распределение **tiers** по §9.
6. `npm run build`; смоук: новый профиль, 3 периода, хотя бы одно событие с **`xp_delta`**.

---

## 3. Assumptions

1. `GameProfile.level` / `GameProfile.xp` — источник для окна **`event_tier`**; «геймификация финансов» в overview (**строка + score**) **не смешивается** с фильтром событий.
2. В одном периоде **не дважды** одна и та же `definition_id`.
3. **Plan** в UI может отсутствовать; симметрию данных по **`save_kind`** сохранять.
4. Clamp на дельту «жизни» из событий — константа **`EVENT_LIFESTYLE_DELTA_ABS_CAP`** в коде (см. §7); точное значение после баланса — на усмотрение продукта.

---

## 4. Термины

| Термин | Смысл |
|--------|--------|
| **`event_tier`** | Целое ≥1 «ранг сложности/глубины» сценария; участвует в отборе. |
| **Окно выпадания** | `lower = max(1, L − 2)`, `upper = L`; определение eligible если `lower ≤ event_tier ≤ upper`. |
| **`repeat_policy`** | `repeatable` (дефолт) или `once_per_profile`; см. §6. |
| **`character_*`** | Поля RPG в **`FinanceOverview`** (§8). |

---

## 5. Прогрессия персонажа (единая модель XP)

**Норматив по формулам, философии разблокировок механик и таблице начисления XP:** **[`LEVEL_XP_SYSTEM`](../../specs/gameplay/LEVEL_XP_SYSTEM.md)** (особенно §4 формулы, §5 принципы, §3 дорожная карта механик).

Список **конкретных источников** (действия API и события с ожиданиями XP) ведём в **[`XP_EVENTS_ACTIONS_MATRIX`](../../specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md)**; после рефакторинга `apply_character_xp` (§11 этого spec) столбцы baseline должны совпадать с константами кода.

**Норматив формулы v1 порога между уровнями** остаётся идентичным текущему проду-коду до отдельного решения продукта (см. `LEVEL_XP_SYSTEM §4`):

```
need(L) = 100 + max(0, L - 1) * 50
```

Применение нескольких level-up подряд, поля **`character_*` в overview** — без изменений смысла относительно предыдущей редакции этого §5 (детально в `LEVEL_XP_SYSTEM`).

---

## 6. Алгоритм отбора событий периода

Расширение `ensure_period_events` (`backend/app/routers/events.py` или выделенный сервис после рефакторинга):

### 6.1. Базовый пул после `save_kind`

Старое условие: `is_active=1`, `(mode == save_kind) OR (mode == 'any')`.

### 6.2. `repeat_policy`

- **`repeatable`**: без фильтра по истории определений.
- **`once_per_profile`**: исключить `definition_id`, для которых у профиля есть хотя бы один `EventInstance` со статусом **`selected`** (любой период). Статус **`expired`** (**§6.2а**) для этого правила **не** считается «прохождением»: сценарий без выбора можно снова выдать позже.

### 6.2а. Переход `pending` → `expired`

**Когда:** в **`process_period_end`**, для **закрываемого** периода **`P`** (текущий `profile.period_index` до инкремента), **до** выполнения `profile.period_index += 1`: все `EventInstance` этого профиля с `period_index == P` и `status == pending` переводятся в **`expired`**.

**Без «выполнения»:** да — типичный случай: игрок не нажал выбор до конца периода; `selected_choice_id` остаётся пустым.

**Повтор после «провала» (плохой исход по деньгам/жизни, но выбор сделан):** запись в **`selected`**. Для **`repeatable`** то же определение может снова попасть в выдачу в следующих периодах. Для **`once_per_profile`** повторной выдачи **нет** (сюжет считается отыгранным выбором, независимо от того, «выгодный» это был выбор или нет).

### 6.3. Окно `event_tier`

`L = max(1, profile.level)`; множество `CORE = { d | lower ≤ d.event_tier ≤ upper }` с `lower = max(1, L − 2)`, `upper = L`.

### 6.4. Fallback при недостаточном числе defs

Все шаги **сохраняют инвариант** `event_tier ≤ L` (сценарий «тяжелее текущего уровня игрока» не выпадает до роста `level`).

Пусть после §6.2 имеется пул `P0 = CORE ∩ repeat_ok`, **`k_goal = EVENTS_PER_PERIOD`**.

- Если `|P0| ≥ k_goal`: выбирать **`k_goal`** определений **из `P0`** (веса §6.5), без повторов.
- Если `|P0| < k_goal`: **расширить окно вниз** — `P1 = { d ∈ repeat_ok | 1 ≤ d.event_tier ≤ L }`. Выбрать **`k = min(k_goal, |P1|)`** из `P1` без повторов.
- Если `|P1| == 0`: **WARN/ERROR лог**, не создавать инстансов **или** откатиться к защитному сидированию только определений с `event_tier = 1` (как технический последний резерв без нарушения инварианта). В штатной конфигурации контента эта ветка **не выполняется** (сид §9 это гарантирует для диапазона уровней 1–8).

**(Удалено:** расширение `upper` выше \(L\) — противоречит выбранной продуктовой модели.)**

### 6.5. Взвешенная случайная выборка

Сохранить **весовую** случайную выборку **без повторов** при малых N (типично ≤20 кандидатов): использовать алгоритм weighted sampling **без замещения** (например взвешенный порядок по `−ln(U)/weight` с ключом Uniform(0,1), либо эквивалент). **`random.choices`** с параметром по умолчанию даёт замещение и **не** подходит один в один без дедупля по шагам.

---

## 7. Расширение `effects_json` на выборе события

Разрешённые ключи (расширение только после правки этого spec):

| Ключ | Тип | Поведение |
|------|-----|-----------|
| `cash_delta` | number | уже есть |
| `safety_delta` | number | уже есть |
| `xp_delta` | int \(\geq 0\) | §5 утилита; **отрицательные недопустимы** по [`LEVEL_XP_SYSTEM §10`](../../specs/gameplay/LEVEL_XP_SYSTEM.md) — штрафы только денежные/Lifestyle |
| `monthly_lifestyle_delta` | number | добавить к `GameProfile.delta_monthly_lifestyle_expense`; **clamp** суммарного абсолютного изменения за одну операцию применения событий — константа **`EVENT_LIFESTYLE_DELTA_ABS_CAP`** в коде; стартовая реализация может взять **15000**. Окончательное значение или привязка к шаблону обязательств — **на усмотрение продукта** (при необходимости отдельная сессия idea-refine), без блокировки merge MVP 1.1 |

Неизвестные ключи при выборе: **HTTP 400** с текстом ошибки конфигурации (dev-friendly detail).

Порядок применения: сначала денежные эффекты с проверкой остатка `cash`/подушки как сейчас; затем `monthly_lifestyle_delta`; затем `xp_delta` через §5.

---

## 8. API

### 8.1. `FinanceOverview`

Дополнительно (additive):

```
character_level: int
character_xp: int
character_xp_need_for_next: int
```

Существующие `gamification_level`, `score`, `xp_to_next_level` без семантической ссылки на RPG-события.

### 8.2. `GET /api/game/events/pending`

Без изменения формы массива; контент задаёт паттерн **короткий title + description** из [`TARGET_PLAYER_AND_SESSION §7`](../../foundation/TARGET_PLAYER_AND_SESSION.md).

---

## 9. Миграция и сид

### 9.1. Колонки `event_definitions`

| Колонка | Тип | Default |
|---------|-----|---------|
| `event_tier` | INT NOT NULL | 1 |
| `repeat_policy` | VARCHAR(32) NOT NULL | `repeatable` |

Файл миграции: следующий свободный номер в `backend/migrations/`.

### 9.2. Контент волны 1

- Минимум **12** определений активных под game/any после миграции.
- Хотя бы **6** defs с **`event_tier == 1`**, хотя бы **4** с tier ∈ {2,3}, хотя бы **2** с tier ≥ 4 для проверки «пустого окна» на низком L.
- Без тем из **`TARGET_PLAYER_AND_SESSION` §3** (никаких микрозаймов, казино и т.д.).

---

## 10. Frontend (обязательный минимум)

1. Блок на главном игровом экране: **Уровень** + шкала **`character_xp` / `character_xp_need_for_next`** из overview (MQX-согласование с [`SPEC_FRONTEND_UI`](../SPEC_FRONTEND_UI.md)).
2. Не использовать `gamification_*` строки как единственный индикатор «роста игрока» на этом блоке для MVP 1.1 UX.
3. На **карточке события** числовой **`event_tier`** пользователю **не показывать** (обучение — через текст/иконки контента, не через tier).
4. Визуал прогресса к **победе MVP** — опционально в том же спринте; если нет — отдельная задача (backlog уже содержит схожие пункты).

---

## 11. Рефакторинг кода XP

Выделить модуль например **`backend/app/character_progression.py`** (`apply_character_xp(game_profile, delta: int, db)` → сохранённые изменения).

Заменить дубль логики в:

- `game_period.py` (конец периода);
- `period_actions.py` (зарплата, переводы, прочее где уже XP).

При расхождении поведений в разных участках исторического кода — **нормативом считает** этот spec и поведение, совпадающее с утилитой после рефакторинга (**регрессии ловят тестом**).

---

## 12. Explicit non-goals

| Тема | Почему |
|------|--------|
| Victory M из N | отдельный эпик |
| Обязательные блокирующие события | флаг уже есть без логики |
| Отдельный CMS | SQL/сиды достаточно |
| Изменение глобальных правил `win_reached` | вне этого spec |

---

## 13. Тест-план

| Что | Как |
|-----|-----|
| Окно tier | табличные случаи L=1,2,7 на фикстурных defs |
| repeat_policy | один def `once`: второй спавн недоступен после **selected**; после **expired** без выбора — снова допустим |
| `pending` → `expired` | конец периода: все незакрытые инстансы закрываемого `period_index` → `expired` |
| Overview | содержимое `character_*` согласовано после XP |
| Сборка фронта | `npm run build` |

---

## 14. Следующие артефакты

План исполнения: **[`PLAN_mvp-11-progression-events`](../../plans/PLAN_mvp-11-progression-events.md)**.

Задачи **MQ-111–MQ-116** в **[`PRODUCT_BACKLOG`](../../backlog/PRODUCT_BACKLOG.md)**; трассировка эпика **M11** в **[`TRACEABILITY`](../../TRACEABILITY.md)**.

---

## 15. Оставшиеся продуктовые тонкости (не блокируют MVP 1.1)

- Точное значение **`EVENT_LIFESTYLE_DELTA_ABS_CAP`** после баланса или привязка к шаблону — по мере необходимости (см. §7; skill **idea-refine** по желанию).

---

### История

2026-05-17: зафиксированы решения пользователя (**tier-window** + **архитектура repeat_policy**, контент once отложен).  
2026-05-17: spec **approved**; добавлен выполняемый план **`PLAN_mvp-11-progression-events`**.  
2026-05-17: закрыты вопросы UI (**без tier на карточке**), семантика **`expired`** и повторов при **`once_per_profile` / repeatable**; clamp lifestyle — гибкий до баланса.
