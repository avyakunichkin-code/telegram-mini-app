# Документация ТВОЙ ХОД

Структура **вариант A** (слои зрелости): [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)  
Шаблоны: [`templates/`](templates/) · Трассировка эпиков: [`TRACEABILITY.md`](TRACEABILITY.md)

Технический онбординг: [`../CLAUDE.md`](../CLAUDE.md)

---

## Карта папок

| Слой | Путь | Назначение |
|------|------|------------|
| **Система** | [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md) | Конвейер idea → spec → plan → tasks |
| **Foundation** | [`foundation/`](foundation/) | Продукт «как есть», потоки, термины |
| **Vision** | [`vision/ideas/`](vision/ideas/) | Идеи и целевое направление (idea-refine) |
| **Specs** | [`specs/`](specs/) (включая [`specs/gameplay/`](specs/gameplay/)) | Что строим |
| **UX (экраны)** | [`ux/screens/`](ux/screens/) | Per-screen UX-spec (дополнение к SPEC_FRONTEND_UI) |
| **Plans** | [`plans/`](plans/) | Как строим (срезы, зависимости) |
| **Tasks** | [`tasks/`](tasks/) | Выгрузка MQ-* (опционально) |
| **Decisions** | [`decisions/`](decisions/) | ADR — почему так |
| **Backlog** | [`backlog/`](backlog/) | Приоритеты P0–P3 |
| **Reference** | [`reference/`](reference/) | GDD, брендбук, investor deck |
| **Marketing** | [`marketing/`](marketing/) | Посты, трекер тем, стиль, Telegram-публикация |
| **Ops** | [`ops/`](ops/) | Деплой prod / Pre-Alpha ([`ops/DEPLOY.md`](ops/DEPLOY.md)) |
| **Agents** | [`agents/`](agents/) | Cursor skills и приоритеты |

---

## Быстрый вход по роли

| Роль | Читать |
|------|--------|
| Разработчик / агент | `CLAUDE.md` → [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) → spec своей фичи |
| Продукт | [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) + [Часть II (evolution)](vision/ideas/tvoy-hod-evolution-after-mvp.md) |
| UI/UX | [`specs/SPEC_FRONTEND_UI.md`](specs/SPEC_FRONTEND_UI.md) + [`ux/screens/`](ux/screens/) + [`ux/CHARACTER_NEEDS_UX.md`](ux/CHARACTER_NEEDS_UX.md) + [`reference/brandbook/BRANDBOOK.md`](reference/brandbook/BRANDBOOK.md) + [`BRANDBOOK_MQX.md`](reference/brandbook/BRANDBOOK_MQX.md) |
| Лендинг / скрины MQX | [`specs/LANDING_SCREENSHOTS.md`](specs/LANDING_SCREENSHOTS.md) + [`landing/README.md`](../landing/README.md) |
| Маркетинг / посты | [`marketing/README.md`](marketing/README.md) + скилл **social-changelog-posts** |
| Планирование | [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) + [`TRACEABILITY.md`](TRACEABILITY.md) |

---

## Ключевые документы

### Foundation

| Документ | Содержание |
|----------|------------|
| [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика MVP; **раздел 0** — краткая дорожная карта Game/Plan |
| [`foundation/TMA_USER_FLOWS.md`](foundation/TMA_USER_FLOWS.md) | Потоки и боли Telegram Mini App |
| [`foundation/TARGET_PLAYER_AND_SESSION.md`](foundation/TARGET_PLAYER_AND_SESSION.md) | ЦА MVP 1.1+, типичная сессия, рамки контента, паттерны копирайта событий |
| [`foundation/GLOSSARY.md`](foundation/GLOSSARY.md) | Термины (период, подушка, save_kind, …) |
| [`foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md) | **Черновик** протокола плейтеста Pre-Alpha (10–20), опрос, чеклист перед волной |
| [`foundation/PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md`](foundation/PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md) | Пилот wave-0 (n=1): итоги и правки после пробного тестера |
| [`foundation/MVP_AUDIT_VS_SPEC.md`](foundation/MVP_AUDIT_VS_SPEC.md) | Чеклист: текущий код vs SPEC_PRODUCT |
| [`foundation/DOC_SYNC_LOG.md`](foundation/DOC_SYNC_LOG.md) | Журнал синхронизации docs ↔ prod |

### Gameplay (прогрессия контента, события)

| Документ | Содержание |
|----------|-------------|
| [`vision/ideas/remove-character-xp-and-levels.md`](vision/ideas/remove-character-xp-and-levels.md) | **Канон (implemented):** без level/XP; `event_tier` от `period_index` |
| [`vision/ideas/starter-template-mechanics-permissions.md`](vision/ideas/starter-template-mechanics-permissions.md) | `blueprint.mechanics` — разделы капитала (**implemented**) |
| [`specs/features/SPEC_mvp-11-progression-events.md`](specs/features/SPEC_mvp-11-progression-events.md) | События: tier, repeat/cooldown (**implemented**) |
| [`vision/ideas/turn-based-period-no-timer.md`](vision/ideas/turn-based-period-no-timer.md) | **TB1 (implemented):** период без real-time таймера; закрытие «Закрыть месяц» |
| [`ux/screens/dashboard.md`](ux/screens/dashboard.md) | UX главной вкладки (hero H2, chips, онбординг) |

Архив level/XP (только git history): `specs/gameplay/LEVEL_XP_SYSTEM.md`, `catalogs/XP_EVENTS_ACTIONS_MATRIX.md`, `plans/PLAN_level-xp-progression.md`.

### Vision

| Документ | Содержание |
|----------|------------|
| [`vision/ideas/tvoy-hod-evolution-after-mvp.md`](vision/ideas/tvoy-hod-evolution-after-mvp.md) | **Часть II** — Game/Plan, Q&A, план по слоям (источник истины для цели) |
| [`vision/ideas/mvp-1-1-product-direction.md`](vision/ideas/mvp-1-1-product-direction.md) | MVP 1.1: закрытые ответы + направления доработки (перед spec эпика) |
| [`vision/ideas/game-balance-thresholds-and-constraints.md`](vision/ideas/game-balance-thresholds-and-constraints.md) | Черновик баланса: победа/поражение MVP, ограничения, пакеты для калибровки по шаблонам |
| [`vision/ideas/event-catalog-qna-refine.md`](vision/ideas/event-catalog-qna-refine.md) | Q&A каталога событий, цепочки (авто, родственник) |
| [`vision/ideas/event-types-and-taxonomy.md`](vision/ideas/event-types-and-taxonomy.md) | Типизация событий (домен, interaction, аналитика, informational «лотерея») |
| [`vision/ideas/event-engagement-anti-fatigue.md`](vision/ideas/event-engagement-anti-fatigue.md) | Анти-усталость пула, конвейер контента, отдельные defs вместо variant B |
| [`vision/ideas/landing-mqx-product-preview.md`](vision/ideas/landing-mqx-product-preview.md) | Лендинг: hero, peek, контраст тем скринов |
| [`vision/ideas/project-structure-standardization.md`](vision/ideas/project-structure-standardization.md) | Структура кода: `screens/`, `api/*`, seeds; границы без big-bang (после split CSS) |

### Specs

| Документ | Содержание |
|----------|------------|
| [`specs/SPEC_FRONTEND_UI.md`](specs/SPEC_FRONTEND_UI.md) | UI/UX MQX, a11y, границы |
| [`specs/LANDING_SCREENSHOTS.md`](specs/LANDING_SCREENSHOTS.md) | PNG для лендинга, `capture-screens.mjs`, `UI_FOCUS`, чеклист перед deploy |
| [`specs/SPEC_APP_SHELL.md`](specs/SPEC_APP_SHELL.md) | Pre-game оболочки, `MqxButton`, design-lab `pre-game-shell` |
| [`specs/SPEC_ANALYTICS.md`](specs/SPEC_ANALYTICS.md) | Вкладка «Аналитика» и данные |
| [`specs/features/SPEC_game-plan.md`](specs/features/SPEC_game-plan.md) | Эпик G1 — Game E2E, `save_kind`, ADR-001 (**implemented**) |
| [`specs/features/SPEC_mvp-11-progression-events.md`](specs/features/SPEC_mvp-11-progression-events.md) | MVP 1.1 — **`event_tier`**, **`repeat_policy`**, cooldown; tier-окно от **`period_index`** (см. remove-character-xp); план — [`plans/PLAN_mvp-11-progression-events.md`](plans/PLAN_mvp-11-progression-events.md) |
| [`specs/gameplay/EXPENSES_SYSTEM.md`](specs/gameplay/EXPENSES_SYSTEM.md) | Канон механики **расходов** (категории, burn, Game/Plan) |
| [`specs/features/SPEC_expenses.md`](specs/features/SPEC_expenses.md) | Эпик **E1** — внедрение на всех слоях; чеклист — [`specs/economy/EXPENSES_LAYER_CHECKLIST.md`](specs/economy/EXPENSES_LAYER_CHECKLIST.md) |
| [`specs/features/SPEC_onboarding-tma.md`](specs/features/SPEC_onboarding-tma.md) | Эпик **O1** — Mission Brief, 3 шага, Pre-Alpha |
| [`reference/CHARACTER_MONETKA.md`](reference/CHARACTER_MONETKA.md) | Персонаж-наставник **Монетка** (онбординг) |

### Backlog и агенты

| Документ | Содержание |
|----------|------------|
| [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) | Бэклог P0–P3 |
| [`agents/CURSOR_SKILLS.md`](agents/CURSOR_SKILLS.md) | Приоритет Agent Skills |

### Decisions (ADR)

| Документ | Содержание |
|----------|------------|
| [`decisions/ADR-007-backend-domain-packages.md`](decisions/ADR-007-backend-domain-packages.md) | **Структура backend:** `app/{game,finance,victory,…}/`, `services/` |
| [`decisions/ADR-002-victory-engine-and-template-config.md`](decisions/ADR-002-victory-engine-and-template-config.md) | Victory v2, `victory_config_json` |
| [`decisions/ADR-001-save-kind-remove-light-hardcore.md`](decisions/ADR-001-save-kind-remove-light-hardcore.md) | `save_kind` game/plan |

Полный список: [`decisions/`](decisions/).

### Reference

| Документ | Содержание |
|----------|------------|
| [`reference/TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md`](reference/TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md) | GDD-оглавление |
| [`reference/brandbook/BRANDBOOK.md`](reference/brandbook/BRANDBOOK.md) | Brand Guidelines (identity) |
| [`reference/brandbook/BRANDBOOK_MQX.md`](reference/brandbook/BRANDBOOK_MQX.md) | Product UI (MQX) |
| [`reference/brandbook/assets/INDEX.md`](reference/brandbook/assets/INDEX.md) | Пакет лого и Монетки |
| [`reference/investor-deck/INVESTOR_DECK.md`](reference/investor-deck/INVESTOR_DECK.md) | Investor deck |

---

## Конвейер (кратко)

1. **idea-refine** → `vision/ideas/<slug>.md`
2. **spec** → `specs/features/SPEC_<slug>.md` (DoR в [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md))
3. **plan** → `plans/PLAN_<slug>.md`
4. **tasks** → MQ-* в plan или `tasks/`
5. **код** → PR со ссылкой на spec

---

## Пути после миграции (май 2026)

Канонические пути — в таблице «Карта папок» выше. Старые `docs/SPEC_PRODUCT.md`, `docs/ideas/`, редиректы в корне `docs/` **удалены** (2026-05-26); при битой ссылке смотрите [`foundation/`](foundation/), [`vision/ideas/`](vision/ideas/), [`reference/`](reference/).
