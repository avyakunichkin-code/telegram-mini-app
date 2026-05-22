---
layer: idea
status: draft
owner: product
last_reviewed: 2026-05-22
tracks: events, gameplay, analytics
---

# Типизация событий и таксономия

## Problem Statement

**How might we** группировать события по смыслу (авто, страховка, обучение…), чтобы настраивать пулы, UI и **аналитику вовлечённости** («с какими типами игроки чаще взаимодействуют»), не путая это с прогрессией по уровню?

## Что уже есть в коде (не путать)

| Поле / понятие | Назначение сейчас | Это «тип события»? |
|----------------|-------------------|---------------------|
| **`event_tier`** | Глубина/сложность сценария; окно выпадания от `GameProfile.level` | **Нет** — ось прогрессии, не тематика |
| **`repeat_policy`** | Повторяемость (`repeatable`, `once_per_profile`, …) | **Нет** — жизненный цикл |
| **`mandatory_gate`** | Блокирует ли конец периода | **Нет** — давление UX |
| **`prerequisites_json`** | Условия показа (активы, долги, запреты) | **Нет** — гейт, не классификация |
| **`category`** (колонка БД) | Задумана в foundation, **в сидах MVP 1.1 не заполнена** | **Кандидат** под домен или дубль `event_domain` |
| **`metadata_json`** | Расширяемые ключи (предвестники и т.д.) | **Кандидат** для поэтапного внедрения без миграции |
| **Классы A–E** ([`event-catalog-qna-refine.md`](event-catalog-qna-refine.md)) | Форма сценария (мягкий оффер, цепочка, привязка к активу…) | **Да**, но ортогонально теме |

**Вывод:** отдельной **тематической** типизации пока нет; её нужно ввести явно и не смешивать с `event_tier`.

---

## Рекомендуемая модель: три оси

### 1. `event_domain` — тема (для аналитики и баланса пула)

Стабильный enum в snake_case. Одно основное значение на определение; при необходимости теги в `metadata_json.tags[]`.

| `event_domain` | Русское имя | Примеры контента |
|----------------|-------------|------------------|
| `consumption` | Повседневные траты | продукты, подписки, проездной, зал |
| `housing` | Жильё и быт | интернет, переезд, уменьшение квартиры, затопление |
| `health` | Здоровье | аптечка, растяжение, страховой агент (частично) |
| `insurance` | Страхование | агент, покрытие, выплаты по ДТП/затоплению |
| `auto` | Авто | подержанное авто, ДТП |
| `credit_debt` | Кредиты и долги | рефинанс (когда включим) |
| `investment_education` | Обучение и «инвест-офферы» | курс, вебинар |
| `social_family` | Социум и семья | родственник, свадебный подарок |
| `income_work` | Доход и работа | (резерв под будущие события) |
| `meta` | Системные | `mq11_events_unlock_intro` |

**Правило:** домен отвечает на вопрос «**о чём** карточка», а не «насколько она сложная».

### 2. `interaction_kind` — как игрок взаимодействует

| `interaction_kind` | Поведение | UI (целевое) |
|--------------------|-----------|--------------|
| `choice` | 2+ кнопок с `effects` | Текущая карточка MQX |
| `informational` | Нет ветвления; одно действие «Понятно» / автозакрытие | **Красный / предупреждающий** стиль (отдельный вариант карточки) |
| `chain_followup` | Продолжение цепочки (`enqueue_event`), часто не в random pool | Как `choice`, в описании — контекст part 1 |
| `intro` | Разовое обучение | Мягкий тон, без экономического давления |

**Метрика вовлечённости:** для `choice` и `chain_followup` считаем **выбор** (`event_choose` + `event_domain`); для `informational` — **просмотр/закрытие** (отдельное событие аналитики).

### 3. `scenario_shape` — механическая форма (уже согласовано в Q&A)

| Код | Смысл |
|-----|--------|
| `soft_offer` | Отказ без денег допустим |
| `mandatory` | Нужно закрыть (часто `blocks_period_end`) |
| `chain` | Есть part 2+ через `event_profile_chains` |
| `asset_linked` | `prerequisites_json` по активам |
| `narrative_once` | `once_per_profile`, сюжет без повтора |

Одно событие может сочетать, например: `event_domain=auto` + `scenario_shape=chain` + `interaction_kind=chain_followup`.

---

## Черновая разметка каталога MVP 1.1

| `key` | `event_domain` | `interaction_kind` | `scenario_shape` |
|-------|----------------|--------------------|--------------------|
| `mq11_groceries_discount` | `consumption` | `choice` | `soft_offer` |
| `mq11_streaming_offer` | `consumption` | `choice` | `soft_offer` |
| `mq11_gym_membership` | `consumption` | `choice` | `soft_offer` |
| `mq11_transport_pass` | `consumption` | `choice` | `soft_offer` |
| `mq11_pharmacy_stock` | `health` | `choice` | `soft_offer` |
| `mq11_home_internet` | `housing` | `choice` | `soft_offer` |
| `mq11_sprain_leg` | `health` | `choice` | `mandatory` |
| `mq11_evening_course` | `investment_education` | `choice` | `soft_offer` |
| `mq11_family_money_request` | `social_family` | `choice` | `chain` (part 1) |
| `mq11_family_money_callback` | `social_family` | `chain_followup` | `chain` (part 2, план) |
| `mq11_insurance_agent` | `insurance` | `choice` | `soft_offer` |
| `mq11_used_car_offer` | `auto` | `choice` | `chain` |
| `mq11_used_car_deadline` | `auto` | `chain_followup` | `chain` + `mandatory` |
| `mq11_relocation_bonus` | `housing` | `choice` | `soft_offer` |
| `mq11_refinance_bank` | `credit_debt` | `choice` | `soft_offer` (**выкл.** до механики) |
| `mq11_investment_webinar` | `investment_education` | `choice` | `soft_offer` |
| `mq11_downsize_flat` | `housing` | `choice` | `soft_offer` |
| `mq11_car_accident` | `auto` + `insurance` | `choice` | `asset_linked` + `mandatory` |
| `mq11_home_water_damage` | `housing` + `insurance` | `choice` | `asset_linked` + `mandatory` |
| `mq11_events_unlock_intro` | `meta` | `intro` | `narrative_once` |
| `mq11_wedding_gift_once` | `social_family` | `choice` | `narrative_once` |

Для «двойного» домена (ДТП) в аналитике: **primary** в колонке + **secondary** в `metadata_json.secondary_domains[]`.

---

## Идея в бэклог: «лотерея родственника» (informational)

**Контекст:** после цепочки «родственник» игрок мог **дважды отказать** в деньгах (part 1 + part 2). Сейчас **без доп. штрафа** (согласовано 2026-05-22). Позже — эмоциональное последствие без нового выбора.

**Сюжет (черновик):** через N периодов — информационная карточка: родственник выиграл в лотерею, раздал долги, близким досталась доля; **вам ничего не перешло**, потому что вы раньше отказали помочь.

| Параметр | Предложение |
|----------|-------------|
| `interaction_kind` | `informational` |
| `event_domain` | `social_family` |
| Триггер | `requires_chain_branch` / закрытая цепочка `family_money_refusal` с веткой «двойной отказ» |
| Эффекты | Нет `cash_delta`; опционально `xp_delta: 0` |
| UI | Вариант карточки **warning / «упущенная возможность»** (красный акцент MQX) |
| Повтор | `once_per_profile` |

**Не в MVP ближайшего спринта** — только после стабилизации цепочки part 1/2 и типа `informational` в API/UI.

---

## Аналитика (когда типы в данных)

1. При `POST /api/game/events/{id}/choose` — писать `definition_key`, `event_domain`, `interaction_kind`, `choice_index`.
2. Дашборд: **доля периодов с хотя бы одним выбором** по домену; **среднее число выборов** на домен; top definitions.
3. Не смешивать с `event_tier` в отчётах — tier для когорт «по уровню», domain для «что интересно».

См. также [`specs/SPEC_ANALYTICS.md`](../../specs/SPEC_ANALYTICS.md) — дополнить разделом «события по домену» при переходе idea → spec.

---

## Путь внедрения (инкремент)

| Фаза | Действие |
|------|----------|
| **0 (сейчас)** | Договориться о enum; разметить сиды в документе (таблица выше) |
| **1** | Ключи `event_domain`, `interaction_kind`, `scenario_shape` в `metadata_json` + отдача в API pending event |
| **2** | Миграция: колонка `event_domain VARCHAR(32)` **или** заполнение legacy `category` тем же enum |
| **3** | Сиды + валидация в тестах; рефинанс `is_active=0` |
| **4** | UI: `informational` + warning-стиль; цепочка родственника |
| **5** | Продуктовая аналитика + informational «лотерея» |

---

## Варианты контента (согласовано 2026-05-22)

**Не** хранить «variant B» в одной записи `EventDefinition` с общим заголовком — игроку кажется тот же попап с другими цифрами.

**Делать:** отдельные **`key`** (`mq11_streaming_offer`, позже `mq11_streaming_price_hike`, …):

- тот же `event_domain` и похожие `effects` (expense_line, cash_delta);
- **другой** title/description и суммы;
- общий `cooldown_periods` / tier по смыслу;
- одна строка в `EVENT_TAXONOMY` на key.

Конвейер добавления — [`event-engagement-anti-fatigue.md`](event-engagement-anti-fatigue.md) § «Система добавления событий».

## Open Questions

- [ ] Один домен vs primary+secondary для ДТП/затопления в отчётах?
- [ ] `informational`: одна кнопка «Понятно» или таймер автозакрытия?
- [ ] Показывать ли `event_domain` игроку (иконка на карточке) или только внутренняя разметка?

## Not Doing (пока)

- Автоматический «редактор типов» в админке.
- Подбор событий **только** по домену без `event_tier` и prerequisites — домен не заменяет прогрессию.
