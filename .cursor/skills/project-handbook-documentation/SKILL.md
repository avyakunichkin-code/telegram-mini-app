---
name: project-handbook-documentation
description: >-
  Plans and maintains the human-readable project documentation package in
  docs/handbook/ (GDD, product brief, playtest guides, feature matrix, economy
  split). Use when building or updating handbook for playtesters, partners, or
  internal team; when PO asks for project documentation package or GDD refresh;
  not for ADRs or feature specs (use documentation-and-adrs / spec-driven-development).
argument-hint: "[audience: playtest|team|partner|wave|doc name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

# Project Handbook Documentation

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/handbook/README.md`](../../../docs/handbook/README.md) — путеводитель, три аудитории
- [`docs/handbook/GAME_FORMAT.md`](../../../docs/handbook/GAME_FORMAT.md) — **approved** карта разделов GAME
- [`docs/DOCUMENTATION_SYSTEM.md`](../../../docs/DOCUMENTATION_SYSTEM.md) — конвейер idea → spec → code
- [`docs/foundation/SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md) — контракт prod (не дублировать поведение)
- [`docs/foundation/TARGET_PLAYER_AND_SESSION.md`](../../../docs/foundation/TARGET_PLAYER_AND_SESSION.md) — ЦА, тон
- [`docs/foundation/MVP_AUDIT_VS_SPEC.md`](../../../docs/foundation/MVP_AUDIT_VS_SPEC.md) — статусы vs код
- [`docs/foundation/DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md)

**Куда писать:** `docs/handbook/`, `docs/handbook/roles/`, `docs/handbook/internal/` (формулы, team-only).  
**Не писать сюда:** `docs/specs/features/` (контракты фич), `docs/decisions/` (ADR — скилл `documentation-and-adrs`).  
**Satellite:** `documentation-and-adrs` при архитектурном решении; `spec-driven-development` если handbook выявил пробел в spec.  
**Дальше:** плейтест → обновить `PRE_ALPHA_PLAYTEST_PROTOCOL`; релиз → `release-tma`.

---

## Overview

**Handbook** — слой **для людей**: зачем продукт, как играть, что в prod, куда смотреть дальше.  
**Specs / foundation** — **для контракта и агентов**: API, acceptance, ADR.

Один репозиторий, **три аудитории** (не три копии репо):

| Аудитория | Первый документ | Не отдавать |
|-----------|-----------------|-------------|
| **Плейтестеры** | `PLAYER_EXPERIENCE.md` | `handbook/internal/` |
| **Команда** | `PRODUCT_BRIEF.md` → `GAME.md` → specs/ADR | — |
| **Партнёры** | `PRODUCT_BRIEF.md` → `FEATURE_STATUS.md` → `ECONOMY_OVERVIEW.md` | `internal/`, сырой backlog |

**Owner:** владелец продукта. **Формат:** Markdown в репо (PDF — только по явному запросу).

---

## When to Use

- Создать или обновить **пакет handbook** (brief, GDD, playtest, матрица фич)
- Подготовить **Pre-Alpha** (инструкция 5 мин, протокол, role-guide playtest)
- Синхронизировать **GAME.md** с prod после эпика (economy, needs, victory)
- Разделить **публичную экономику** и **формулы** (`ECONOMY_OVERVIEW` vs `internal/ECONOMY_TUNING`)
- PO-аудит: «чего не хватает в документации для внешнего читателя»

**When NOT to use:**

- Новая фича с API/поведением → `spec-driven-development` + код
- Только ADR «почему PostgreSQL» → `documentation-and-adrs`
- Правка одной строки в spec без смены narrative → spec напрямую

---

## Источники правды (при конфликте)

1. Код + тесты  
2. `docs/specs/features/SPEC_*.md`  
3. `docs/foundation/SPEC_PRODUCT.md`  
4. `docs/vision/ideas/`  
5. **`docs/handbook/`** — обзор и narrative; при расхождении с 1–3 **править handbook**

---

## Канон пакета (Волна 1 — зафиксировано 2026-05-30)

```
docs/handbook/
├── README.md                 # READER_GUIDE, маршруты по ролям
├── PRODUCT_BRIEF.md          # vision, pillars, MVP 2.0, monetization TBD
├── PLAYER_EXPERIENCE.md      # плейтест: 5 минут
├── FEATURE_STATUS.md         # матрица ✅/🟡/⬜
├── ECONOMY_OVERVIEW.md       # экономика без формул (партнёры)
├── MONETIZATION.md           # B2C TBD; гипотеза советника
├── ADVISOR_FUNNEL_AUDIENCE.md # источник правды: ЦА 45–75k, каналы, lead scoring, лендинг
├── KPI_AND_PHASES.md         # KPI лайт v1 — gate/target по фазам
├── GAME.md                   # GDD текущего prod
├── GAME_FORMAT.md            # approved карта разделов GAME
├── HISTORY.md                # архив анкеты, XP/level
├── internal/
│   ├── README.md
│   └── ECONOMY_TUNING.md     # формулы — только команда
└── roles/
    ├── playtest.md           # active
    ├── marketing.md
    ├── product.md
    ├── game-design.md
    └── engineering.md
```

### Продуктовые решения (не пересогласовывать без владельца)

| Тема | Решение |
|------|---------|
| **ЦА** | 30+, **умная игра** — `TARGET_PLAYER_AND_SESSION.md` |
| **Design pillars** | 1) Умная игра 2) Честные последствия — **не** «низкое трение TMA» |
| **Платформы** | TMA + браузер + **PWA**; продукт не «только Telegram» |
| **MVP 2.0** | **Plan Mode обязателен** (мастер, UI, `save_kind: plan`) |
| **Монетизация** | **TBD** — `MONETIZATION.md`, гипотезы в отдельной ветке |
| **Термин UI/docs** | **Потребности** (не «Самочувствие») |
| **GAME.md** | Именованные разделы по `GAME_FORMAT.md`, без §0–§14 |
| **KPI** | Лайт v1 — `KPI_AND_PHASES.md`; ужесточение v2 после данных |
| **Конкуренты** | Отдельная сессия |

---

## Волны наполнения

| Волна | Содержание | Статус |
|-------|------------|--------|
| **1** | Brief, Player Experience, Feature Status, Economy split, playtest/marketing guides, Pre-Alpha active | ✅ 2026-05-30 |
| **1b** | `ADVISOR_FUNNEL_AUDIENCE` — выжимки в brief/GAME/TARGET/FEATURE_STATUS/roles | ✅ 2026-05-30 |
| **2** | `CONTENT_GUIDE.md`, KPI doc, опрос+CRM из advisor §9.6 | ⬜ |
| **3** | Factsheet партнёрам, positioning, PDF export | ⬜ |

---

## Процедура сессии (agent)

### 1. Scope

Уточни (или возьми из запроса):

- **Аудитория:** playtest | team | partner | all  
- **Документ:** один файл или весь пакет  
- **Триггер:** новая механика в prod, плейтест, партнёрский запрос  

### 2. Сверка с кодом

Перед правкой narrative:

- `MVP_AUDIT_VS_SPEC.md`, `GAME.md` § «Статус production»  
- При экономике — `ADR-009`, `internal/ECONOMY_TUNING.md`  
- При needs — `ADR-005`, `ADR-006`, UX `CHARACTER_NEEDS_UX.md`

### 3. План diff (показать пользователю)

Таблица:

| Файл | Действие | Зависит от |
|------|----------|------------|
| … | create / update | код / PO decision |

**Согласование:** «Могу записать …?» — если не было явного «делай».

### 4. Писать по правилам

**ADVISOR_FUNNEL_AUDIENCE:** полные профили и §9 — **только** здесь; в другие файлы — выжимки + ссылка; обновлять «Карту распределения» в шапке advisor-doc.

**PRODUCT_BRIEF:** vision, 2 pillars, MVP 2.0, § «Бизнес-контекст», B2C TBD vs гипотеза советника.  
**PLAYER_EXPERIENCE:** без путей к Python; **без** CTA на советника в Pre-Alpha.  
**FEATURE_STATUS:** только ✅/🟡/⬜ + ссылка на spec/ADR; синхрон с таблицей в GAME.  
**GAME.md:** только по `GAME_FORMAT.md`; история → `HISTORY.md`.  
**Экономика:** смысл → `ECONOMY_OVERVIEW.md`; формулы → `internal/ECONOMY_TUNING.md`.  
**Role-guides:** короткий маршрут + чеклист; плейтест **не** ссылается на `internal/`.

### 5. Синхронизация

После смысловых изменений:

- [ ] Строка в `docs/foundation/DOC_SYNC_LOG.md`  
- [ ] `docs/README.md` / `handbook/README.md` — маршруты, если менялась структура  
- [ ] `PRE_ALPHA_PLAYTEST_PROTOCOL.md` — ссылка на `PLAYER_EXPERIENCE`, ЦА 30+  
- [ ] Не дублировать длинные § из `SPEC_PRODUCT` в handbook — **ссылка**

### 6. Verdict

| Verdict | When |
|---------|------|
| **COMPLETE** | Запрошенные handbook-файлы созданы/обновлены, DOC_SYNC при необходимости |
| **CONCERNS** | Расхождение handbook vs код — нужен fix в коде или spec, не «придумать» в GDD |
| **BLOCKED** | Нет ответа PO по pillars / MVP scope / аудитории пакета |

---

## Шаблон frontmatter handbook-файла

```yaml
---
layer: handbook          # или handbook-internal для internal/
status: active | draft
last_reviewed: YYYY-MM-DD
audience: playtest | product | partners | team
owner: product           # для brief / format
---
```

---

## Вопросы PO (если пакет с нуля или смена канона)

Задавать только то, что **не** зафиксировано в таблице «Продуктовые решения»:

1. Приоритет волны: playtest vs partner vs полный GDD?  
2. Нужен ли третий design pillar?  
3. Один шаблон старта для всех плейтестеров или любой из каталога?  
4. Экспорт PDF — да/нет?  

**Не спрашивать снова** (зафиксировано): ЦА 30+, 2 pillars, MVP 2.0 Plan, monetization TBD, md-only, owner = product.

---

## Handoff

| Ситуация | Скилл |
|----------|--------|
| Архитектурное «почему» | `documentation-and-adrs` |
| Новая фича / API | `spec-driven-development` |
| Плейтест после правок онбординга | обновить `PLAYER_EXPERIENCE` + `PRE_ALPHA_*` |
| Смена формул периода/victory | `game-economy-and-victory` + `internal/ECONOMY_TUNING` |
| Критичные тесты перед merge | `critical-test-scenarios` |

---

## Anti-patterns

- Переписать все ~140 файлов `docs/` в handbook  
- Дублировать `SPEC_PRODUCT` §3 в GAME построчно  
- Формулы tuning в `ECONOMY_OVERVIEW` или `PLAYER_EXPERIENCE`  
- Вернуть `GAME_TEMPLATE.md` или нумерацию §0–§14  
- Pillar «низкое трение TMA» как продуктовый канон  
- «Самочувствие» вместо **Потребности** в user-facing текстах  

---

## References

- [`docs/specs/build/project-handbook-documentation.md`](../../../docs/specs/build/project-handbook-documentation.md) — краткий build-spec скилла  
- [`docs/handbook/PRODUCT_BRIEF.md`](../../../docs/handbook/PRODUCT_BRIEF.md)  
- [`docs/handbook/PLAYER_EXPERIENCE.md`](../../../docs/handbook/PLAYER_EXPERIENCE.md)  
- [`docs/foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../../../docs/foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md)
