---
layer: vision
status: refined
last_reviewed: 2026-09-07
idea_refine: true
verdict: REFINED
next_spec: ../decisions/ADR-013-game-only-drop-plan-mode.md
related:
  - ../audits/product/2026-09-07-product-game-design.md
  - ../plans/PLAN_production-ready.md
  - ../plans/PLAN_game-only.md
tags:
  - tvoy-hod/layer/idea
  - tvoy-hod/layer/vision
  - tvoy-hod/status/refined
aliases:
  - "Только Game — отказ от Plan Mode"
  - game-only-drop-plan-mode
---
# Только Game: отказ от режима Plan

**Вердикт:** REFINED → решение **принято** в [ADR-013](../decisions/ADR-013-game-only-drop-plan-mode.md) (2026-09-07).  
**Не канон реализации:** вырезание кода — [`PLAN_game-only.md`](../plans/PLAN_game-only.md).

Разбор ниже — шесть ролей той же сессии аудитов. Цель: один продукт = **игра**. Не «два режима, один из них Скоро».

---

## Problem Statement

С 2026-05 продукт обещает **два** типа сохранения: Game (шаблоны, TB1, события) и Plan (ручной бюджет, мастер, MVP 2.0). В prod Plan — плитка **«Скоро»** + живой API (`save_kind=plan`, `BaseParamsScreen`, `PlanExpenseEditor`, тесты `test_plan_expenses_contract`).

Итог: игрок 30+ на старте видит **второй продукт**, который нельзя выбрать; команда держит развилку в схемах, воронке, аналитике, скиллах и бэклоге M2.0. Аудиты 2026-09-07 (product C6, production-ready freeze) уже сказали: **три продукта до одного working loop** — нет. Plan был третьим (вместе с советником).

## Recommended Direction

**Один `save_kind`: `game`.** Старт только из `game_starter_templates` + `template_key`. Плитку Plan убрать. API `plan` — deprecate → 400. Статьи расходов Game (burn из шаблона) остаются. Редактор «свой бюджет с нуля» **не** обещать; если когда-нибудь понадобится — это **инструмент внутри Game** (после D7), не второй режим сохранения.

## Key Assumptions

1. Нет (или ничтожно мало) живых `save_kind=plan` в prod — проверить SQL до выключения API.
2. ЦА 30+ пришла за **умной игрой**, не за Excel в MQX.
3. Педагогика «проживи месяц» не требует ручного мастера на старте — шаблоны закрывают вход.
4. AN1 / вкладка «Аналитика» живут для Game; не зависят от Plan.
5. Воронка советника не нуждается в Plan Mode на лендинге (handbook уже запрещал обещать Plan).

## MVP Scope (решения, не весь код сразу)

| Срез | Что |
|------|-----|
| **Сейчас (канон)** | ADR-013, лексикон, SPEC_PRODUCT, отмена M2.0 как обязательного |
| **GO-01** | Новая игра → шаблоны, без `NewProfileKindScreen` / «Скоро» |
| **GO-02** | `POST start` с `save_kind=plan` → 400; валидация только `game` |
| **GO-03** | Снять Plan UI (`BaseParamsScreen` plan path, editors); Watchtower без сегмента plan |
| **GO-04** | `EventDefinition.mode`: `game` \| `any`; `plan` в YAML трактовать как `any` или вычистить |
| **GO-05** | Колонка `save_kind` оставить (всегда `game`) или сузить check constraint — отдельная миграция |

## Not Doing

- Не строить Plan «потом, когда D7 вырастет» как второй save.
- Не делать battle pass / daily, чтобы «заменить» Plan.
- Не удалять категории burn / `profile_expense_lines` — они часть Game (E1).
- Не сливать советника в игру этим ADR.
- Не выкидывать `save_kind` колонку в том же PR, что UI (нужен аудит prod-строк).

---

## Анализ по ролям

### 1. Game Designer / Product (экономика игрока)

**За отказ:** два фантазийных контракта («проживи сценарий» vs «собери свой бюджет») делят внимание и контент. События YAML, needs, Victory chain, treat-self CD 15 — всё заточено под Game. Plan **выключает needs** (SPEC needs). Два режима = две экономики, два баланса, два FTUE. Product C6: freeze до D7 — фактически Plan и так не строить; честнее **снять обещание**.

**Против:** Plan был ответом «а вдруг советник / power-user хочет свой burn». Шаблон «свой старт» частично закрывается четвёртым сценарием, не мастером 40 полей.

**Вердикт GD:** 🔴 держать Plan как «обязательный 2.0» — вред фокусу. Сложность Game и так excess (подушка, 40–60p). Не переносить мастер Plan в Game до честного close и акта 1.

### 2. Architect

**След в коде (не полный grep):** `GameProfile.save_kind`, `validate_game_start_request`, `start.py` ветка plan, `expenses.py` source_kind plan, `EventDefinition.mode` game\|plan\|any, `applies_to_save_kind` на шаблонах, funnel `by_save_kind`, FE `MqxSaveKindPicker`, `BaseParamsScreen`, `PlanExpense*`, `AnalyticsPremium isGame`. God-модули и так перегружены (Eng M2) — вторая ось save_kind умножает ветвления в `period` / start / overview.

**Следствие:** «циклическая» не в графе пакетов, а в **продуктовом графе**: любой новый YAML/поле overview спрашивает «а для plan?». Это тормозит события и сезонный пак (LiveOps).

**Вердикт:** 🔴 упростить контракт. Оставить колонку до GO-05. Не dual-read `mode`+`save_kind` (ADR-001 уже запретил) — не плодить `save_kind` optional.

**Риск:** сломать `test_plan_expenses_contract` и admin funnel тесты — ожидаемо, переписать на game-only.

### 3. QA Lead

**Сейчас:** отдельный контракт Plan expenses; воронка фильтр plan; старт без template_key только для plan. Две машины состояний на start = больше гонок (уже P0 на game close).

**После отказа:** меньше матрицы (нет «plan + events + needs off»). Регресс: 400 на plan start; нет мёртвого `planSetup` экрана; профили plan в БД — 404/миграция в game **запрещена** (immutable было правилом) → **архив или отказ в bootstrap**.

**Чек-лист GO-02:** curl `save_kind=plan` → 400; UI не открывает BaseParams plan; Watchtower не врёт «0 plan» как будто режим живой (скрыть фильтр).

**Вердикт:** 🟡 снятие упрощает testability. Не смешивать с P0 lock close в одном PR.

### 4. UX / UI

**α-FB-14:** Plan vs Игра — «Скоро» без объяснения. NewProfileKindScreen: два абзаца, вторая плитка disabled — **ложный выбор** (UX: не показывай то, чего нет).

**Влияние FTUE:** лишний тап до шаблонов; первая игра уже скипает в Студента **после** экрана режима — экран почти мёртвый для n=0, вреден для n≥1.

**Решение:** «Новая игра» → сразу `GameTemplatePickScreen` (или авто-Студент при 0 сейвов, как сейчас после выбора Игра). Copy Монетки без «План скоро». Canon lab `new-game-mode` — **переутвердить** без второй плитки (hotfix потока, не новый dashboard).

**Вердикт:** 🔴 плитка «Скоро» бьёт доверие 30+. Убрать важнее, чем полировать desc.

### 5. Live Ops / Community

**Коммуникация:** handbook и лендинг уже «не обещать Plan». Канал всё равно тащит два мира в FEATURE_STATUS («обязателен 2.0»). Тестеры спросят «когда План?» — ответ «не будет отдельным режимом» должен быть в FAQ волны.

**Сезоны:** один пул YAML, не «game pack vs plan pack». D7 не зависит от Plan.

**Вердикт:** 🟡 снять обещание = меньше support. Не анонсировать «вместо Plan — сезон 1».

### 6. Product Owner (сводка)

Согласуется с [`PLAN_production-ready`](../plans/PLAN_production-ready.md): не делать Plan в P0–P3. ADR-013 делает это **постоянным**, не «отложили до D7».

| Вариант | RICE (CA 100) | Заметка |
|---------|----------------|---------|
| A. «Скоро» вечно | 100×0.5×0.9 / 0 ≈ ловушка | Нулевой effort, −NPS |
| B. Достроить M2.0 | 100×2×0.3 / 8 ≈ **7.5** | Второй продукт, product C6 |
| C. **Game only** | 100×2×0.8 / 2 ≈ **80** | Срезы GO-01…03 ~2 н |
| D. Бюджет-редактор внутри Game позже | — | Отдельная идея после D7, не save_kind |

**Что нельзя выпускать:** новую волну 10–20 с плитой «Скоро План» после ADR — репутация «недоделанный второй продукт». GO-01 желателен **до** WAVE1 (P1 плана production-ready).

---

## Риски

| Риск | Проверка |
|------|----------|
| В prod есть plan-профили | SQL `save_kind='plan'` до GO-02 |
| Power-user ждал мастер | Q5 волны; если >20% «хочу свой бюджет» — идея **внутри Game**, не откат ADR |
| E1 expenses «для Plan» в spec | Переписать: burn Game; мастер — out |
| Lab new-game-mode ★ устареет | Canon sync без плитки Plan |

## Связанные документы

- Решение: [ADR-013](../decisions/ADR-013-game-only-drop-plan-mode.md) supersede оговорки Plan в [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md)
- Исторический дуализм: [evolution §II](tvoy-hod-evolution-after-mvp.md) (устарело в части Plan)
- M2.0: [post-playtest-wave1](post-playtest-wave1-two-directions.md) — Plan-трек **отменён**
