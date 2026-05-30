---
layer: handbook
status: active
last_reviewed: 2026-05-30
audience: all human readers
---

# Путеводитель по документации ТВОЙ ХОД

Эта папка — **проектная документация для людей**: что за игра, как она устроена, что уже в prod и куда смотреть дальше. Технический конвейер (spec → plan → tasks → код) остаётся в [`../`](../README.md).

**Главный документ об игре:** [`GAME.md`](GAME.md).

**Продуктовый пакет (2026-05-30):** три аудитории — один репозиторий; **старт для плейтеста** — [`PLAYER_EXPERIENCE.md`](PLAYER_EXPERIENCE.md).

| Документ | Назначение |
|----------|------------|
| [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) | Vision, pillars, MVP 2.0, monetization TBD |
| [`PLAYER_EXPERIENCE.md`](PLAYER_EXPERIENCE.md) | «Как играть за 5 минут» — **плейтестеры** |
| [`FEATURE_STATUS.md`](FEATURE_STATUS.md) | Матрица ✅/🟡/⬜ |
| [`ECONOMY_OVERVIEW.md`](ECONOMY_OVERVIEW.md) | Экономика без формул (партнёры) |
| [`internal/`](internal/) | Формулы tuning — **только команда** |
| [`MONETIZATION.md`](MONETIZATION.md) | TBD, отдельная ветка |
| [`KPI_AND_PHASES.md`](KPI_AND_PHASES.md) | KPI **лайт v1** — Pre-Alpha / Closed Alpha |
| [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md) | ЦА воронки «игра → финсоветник» (45–75k), каналы, lead scoring |
| [`EVENTS_TERMS_RU.md`](EVENTS_TERMS_RU.md) | События: переводчик техтерминов → русский (команда, советник) |

**Owner пакета:** владелец продукта · формат: **Markdown** (PDF — по запросу позже).

**Агент Cursor:** скилл **`project-handbook-documentation`** (`/project-handbook-documentation`) — процедура генерации и синхронизации handbook; build-spec: [`docs/specs/build/project-handbook-documentation.md`](../specs/build/project-handbook-documentation.md).

---

## Слои документации (не путать)

| Слой | Путь | Для кого | Что внутри |
|------|------|----------|------------|
| **Handbook** | `docs/handbook/` | все роли | GDD, путеводитель, будущие role-guides |
| **Foundation** | `docs/foundation/` | продукт, разработка | «Истина о продукте»: [`SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md), глоссарий, аудит vs код |
| **Specs / Plans** | `docs/specs/`, `docs/plans/` | разработка, QA | Контракты фич, acceptance, задачи MQ-* |
| **Vision** | `docs/vision/ideas/` | продукт, дизайн | Идеи и целевое направление (не всё в prod) |
| **Decisions** | `docs/decisions/` | архитектура | ADR — **почему** так решили |
| **Agents** | `CLAUDE.md`, `docs/agents/` | агенты Cursor | Онбординг кода, скиллы, эндпоинты |

**При конфликте:** код + тесты → spec фичи → `SPEC_PRODUCT` → vision/ideas → handbook (обзор).

---

## Легенда статусов

| Маркер | Значение |
|--------|----------|
| ✅ | В production, описание синхронизировано с кодом |
| 🟡 | Частично: backend/UI/контент в работе |
| ⬜ | Запланировано, в prod нет |
| *(архив)* | Исторический материал; не описывает текущую игру |

---

## Маршруты чтения по роли

### Продукт / владелец

1. [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) — vision, § «Бизнес-контекст»  
2. [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md) — воронка советника (гипотеза)  
3. [`GAME.md`](GAME.md) — [статус production](GAME.md#статус-production)  
4. [`../foundation/SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md) §0–7 — реализованный цикл  
3. [`../vision/ideas/tvoy-hod-evolution-after-mvp.md`](../vision/ideas/tvoy-hod-evolution-after-mvp.md) §II — цель Game/Plan  
4. [`../backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) — очередь  
5. [`../foundation/MVP_AUDIT_VS_SPEC.md`](../foundation/MVP_AUDIT_VS_SPEC.md) — сверка с кодом  

→ [`roles/product.md`](roles/product.md)

### Геймдизайн / narrative

1. [`GAME.md`](GAME.md) целиком (§1–4, §7, §1.11 потребности)  
2. [`EVENTS.md`](EVENTS.md) — события (публично)  
3. [`../foundation/TARGET_PLAYER_AND_SESSION.md`](../foundation/TARGET_PLAYER_AND_SESSION.md) — ЦА, тон, жёсткость  
4. [`../specs/features/SPEC_mvp-11-progression-events.md`](../specs/features/SPEC_mvp-11-progression-events.md) — движок событий  
5. [`../ux/CHARACTER_NEEDS_UX.md`](../ux/CHARACTER_NEEDS_UX.md) — потребности персонажа  
6. [`../decisions/ADR-009-metrics-dictionary-tb1.md`](../decisions/ADR-009-metrics-dictionary-tb1.md) — метрики (не путать cashflow и burn)  
7. Каталог событий: `data/events/mvp11/` · authoring: [`../agents/EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md)  

→ [`roles/game-design.md`](roles/game-design.md) *(каркас)*

### Плейтест / QA (Pre-Alpha) — **старт здесь**

1. [`PLAYER_EXPERIENCE.md`](PLAYER_EXPERIENCE.md) — **5 минут, без кода**  
2. [`../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md) · ops: [`PRE_ALPHA_WAVE1_OPS.md`](../foundation/PRE_ALPHA_WAVE1_OPS.md)  
3. [`roles/playtest.md`](roles/playtest.md) — чеклисты участника и модератора  
4. [`FEATURE_STATUS.md`](FEATURE_STATUS.md) — что уже в билде  
5. [`../foundation/GLOSSARY.md`](../foundation/GLOSSARY.md) — термины для опросника  

Опционально: [`GAME.md`](GAME.md) · [`TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md) — **не** `handbook/internal/`.

### Разработка / агент

1. [`../../CLAUDE.md`](../../CLAUDE.md) — карта репозитория  
2. [`../foundation/SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md)  
3. Spec своей фичи в `docs/specs/features/`  
4. [`GAME.md`](GAME.md) — контекст «зачем», не «как в коде»  

→ [`roles/engineering.md`](roles/engineering.md) *(каркас)*

### Маркетинг / партнёр / инвестор

1. [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md)  
2. [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md) — **воронка к финсоветнику** (каналы, сегменты, лендинг)  
3. [`GAME.md`](GAME.md) — [воронка](GAME.md#воронка-привлечения-игроков)  
4. [`FEATURE_STATUS.md`](FEATURE_STATUS.md) · [`ECONOMY_OVERVIEW.md`](ECONOMY_OVERVIEW.md)  
5. [`../reference/brandbook/BRANDBOOK.md`](../reference/brandbook/BRANDBOOK.md)  

→ [`roles/marketing.md`](roles/marketing.md)

---

## Что уже в handbook

| Файл | Назначение |
|------|------------|
| [`EVENTS.md`](EVENTS.md) | **События:** trade-off, потребности, повторы, плейтест |
| [`EVENTS_TERMS_RU.md`](EVENTS_TERMS_RU.md) | Глоссарий кодов каталога (spec/партнёр) |
| [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) | Product brief, pillars, MVP 2.0 |
| [`PLAYER_EXPERIENCE.md`](PLAYER_EXPERIENCE.md) | Плейтест: как играть |
| [`FEATURE_STATUS.md`](FEATURE_STATUS.md) | Матрица фич |
| [`ECONOMY_OVERVIEW.md`](ECONOMY_OVERVIEW.md) | Экономика (публично) |
| [`internal/ECONOMY_TUNING.md`](internal/ECONOMY_TUNING.md) | Формулы (команда) |
| [`MONETIZATION.md`](MONETIZATION.md) | TBD |
| [`KPI_AND_PHASES.md`](KPI_AND_PHASES.md) | KPI лайт v1 |
| [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md) | Маркетинг: ЦА → услуги советника (45–75k ₽) |
| [`GAME.md`](GAME.md) | GDD: механики, цикл, статус, vision |
| [`HISTORY.md`](HISTORY.md) | Архив: анкета, отступления, XP/level |
| [`GAME_FORMAT.md`](GAME_FORMAT.md) | Утверждённая карта разделов GAME |
| [`roles/`](roles/) | Role-guides (playtest, marketing — active) |

## Что пока **не** перенесено сюда

Остальные ~140 файлов `docs/` остаются на местах по [конвейеру](../DOCUMENTATION_SYSTEM.md). План миграции — см. § «Дорожная карта handbook» ниже.

| Материал | Сейчас | План |
|----------|--------|------|
| [`QUESTIONNAIRE.md`](../../QUESTIONNAIRE.md) | корень репо | `handbook/archive/` + баннер «архив» |
| Foundation, specs, ADR | `docs/*` | остаются; handbook только ссылается |
| [`CLAUDE.md`](../../CLAUDE.md) | корень | остаётся (инженерный индекс) |

---

## Дорожная карта handbook

1. **Сделано (2026-05-30):** пакет Волна 1 + advisor + KPI лайт + **ops Pre-Alpha** ([`PRE_ALPHA_WAVE1_OPS.md`](../foundation/PRE_ALPHA_WAVE1_OPS.md)).  
2. **Сейчас:** заполнить URL опроса/чата в ops-листе → smoke → пригласить 10–20.  
3. **Отдельные сессии:** KPI v2; CustDev советника; третий design pillar (опционально).  
4. **Волна 2:** `CONTENT_GUIDE.md`, опрос+CRM в продукте (§9.6 advisor).  
5. **Потом:** `handbook/archive/QUESTIONNAIRE.md`, factsheet для партнёров.

---

## Актуальность

Журнал синхронизации docs ↔ prod: [`../foundation/DOC_SYNC_LOG.md`](../foundation/DOC_SYNC_LOG.md).

*Обновлено: 2026-05-30.*
