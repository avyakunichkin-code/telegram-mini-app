# Money Quest — бэклог и дорожная карта

Живой список работ по слоям **DB / Backend / Frontend / Doc**. Источник идей для этой итерации: **[`GAME.md`](../../GAME.md)** (синтез анкеты, кода, Pre-Alpha → Closed Alpha).

**Трассировка эпиков:** [`TRACEABILITY.md`](../TRACEABILITY.md)  
**Связанные документы:** [`CLAUDE.md`](../../CLAUDE.md), [evolution §II](../vision/ideas/money-quest-evolution-after-mvp.md), [`foundation/SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md), [`foundation/TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md), [`specs/SPEC_ANALYTICS.md`](../specs/SPEC_ANALYTICS.md), [`specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md).

---

## Как пользоваться

| Поле | Смысл |
|------|--------|
| **`[ ]` / `[x]`** | Сделано — `[x]` в начале строки. |
| **`P0`–`P3`** | Критичность (релиз → идея). |
| **Слой** | `DB` · `Backend` · `Frontend` · `Doc` — где основная работа; несколько слоёв через `+`. |
| **`MQ-xxx`** | Задача эпика; см. [`TRACEABILITY.md`](../TRACEABILITY.md). |
| **`⚠ spec`** | Нет нормативного spec — нужен анализ / черновик spec в `Doc`. |

Шаблон:

`- [ ] P1 **[Backend]** Заголовок — пояснение; см. [SPEC_…](../specs/…), MQ-0xx`

---

## Сводка эпиков (май 2026)

| ID | Название | Слои | Статус |
|----|----------|------|--------|
| **G1** | Game / Plan, шаблоны старта | DB+Backend+Frontend | ✅ MQ-101–108 |
| **M11** | MVP 1.1: tier, XP, события, HUD уровня | DB+Backend+Frontend | ✅ MQ-111–116; формальный плейтест Pre-Alpha — ⬜ |
| **M12** | Достижения (цепочки из GAME §5) | DB+Backend+Frontend | 🟡 [SPEC_achievements](../specs/features/SPEC_achievements.md); BE ✅, FE «Развитие» ⬜ |
| **V2** | Victory M из N | DB+Backend+Frontend+Doc | ⬜ `victory_config` — задел в данных |
| **I1** | Страховки: продукт + объект | DB+Backend+Frontend | 🟡 0008 + UI в работе |
| **α** | Pre-Alpha / Closed Alpha гейты | Doc+Frontend (метрики) | ⬜ см. GAME §11 |
| **O1** | Онбординг TMA — Mission Brief (3 шага) | Frontend+Backend+Doc | 🟡 spec draft |
| **A0** | Admin Watchtower (MVP 1.2) | DB+Backend+Frontend | 🟡 Phase 0 в коде |
| **E1** | **Расходы жизнеобеспечения** — категории, статьи бюджета, burn, UI | DB+Backend+Frontend+Content | ⬜ [EXPENSES_SYSTEM](../specs/gameplay/EXPENSES_SYSTEM.md) · [SPEC](../specs/features/SPEC_expenses.md) draft |

> **Расхождение с GAME.md §0.2:** `cooldown_periods` и фильтр в `ensure_period_events` **уже в коде** (`game_rules.is_event_definition_eligible`, `events.py`, миграция 0007). В GAME.md пометить «не реализовано» — устарело.

---

## DB (схема, миграции, сиды)

### Сделано / в проде по миграциям

- [x] **MQ-101** — `save_kind`, `game_starter_templates`, lifestyle delta (`0004`, `0005`).
- [x] **MQ-111** — `event_definitions.event_tier`, `repeat_policy` (`0006`).
- [x] **MQ-111+** — `cooldown_periods`, счётчики выбора событий (`0007`).
- [x] **M12 (часть)** — таблицы цепочек достижений (`0009_achievement_chains.sql`).
- [x] **I1 (часть)** — страховки: `product`, `insured_object`, `payout_amount`, срок (`0008_insurance_product_object.sql`).

### Очередь

- [ ] P0 **[DB]** Бэкапы БД и проверка восстановления на staging.
- [ ] P1 **[DB]** Alembic / версионируемые миграции — снижение дрейфа схемы (сейчас SQL + автодобавление в `main.py`).
- [ ] P1 **[DB] ⚠ spec** Victory v2 — нормализовать схему `victory_config_json` (цели, M из N, `min_period_index_for_victory`) — evolution §II.3.
- [ ] P1 **[DB] ⚠ spec** Plan Mode — поля префилла / `starter_params_json` на шаблоне или снимке.
- [ ] P2 **[DB] ⚠ spec** События: `prerequisites_json`, `chain_id`, веса 🟢🔴🟡 по уровню (GAME §7.3–7.4) — нет каталога колонок в spec.
- [x] P2 **[DB]** Сиды достижений по GAME §5.3 (6×4) — `achievement_seeds.py`, [SPEC_achievements](../specs/features/SPEC_achievements.md) §7.
- [ ] P2 **[DB]** Расширить сиды событий до 20–25 на tier (рекомендация GAME §8.3) + значения `cooldown_periods` в контенте.
- [ ] P3 **[DB] ⚠ spec** Журнал аудита / product events — таблица или внешняя аналитика.

---

## Backend (API, доменная логика, тесты)

### MVP и G1 / M11 (закрыто в коде)

- [x] Core loop, зарплата, подушка, финансы, инвестиции, страховки, победа MVP, поражение.
- [x] **MQ-112** — `ensure_period_events`: tier \([L−2, L]\), `repeat_policy`, cooldown, fallback.
- [x] **MQ-113** — `character_progression.py`, единый `apply_character_xp`.
- [x] **MQ-114** — whitelist `xp_delta`, `monthly_lifestyle_delta` в choose.
- [x] **MQ-115** — `GET /finance/overview`: `character_*`, `avg_net_cashflow_6p`.
- [x] P0 **MQ-116 (приёмка)** — прогон сидов MVP 1.1 на чистой БД; контрактные тесты tier/cooldown/XP (`test_mq116_acceptance.py`, `mvp11_catalog_contract.py`, `test_ensure_period_events.py`).

### Эпик M12 — достижения (из GAME §5)

- [x] **[Backend]** `achievement_engine.py`, хуки в `game_period`, `finance`, `GET /api/achievements` (черновик).
- [x] P0 **[Backend]** Критерии `criteria_json` по tier из GAME §5.3 (без `stub` в сидах); `test_achievement_engine.py`.
- [ ] P1 **[Backend]** Стабильный контракт `GET /api/achievements` + синхронизация `api.js`; интеграционные тесты с БД.
- [x] P1 **[Backend]** API-gates по `character_level` — `level_gates.py`, invest/insurance/finance from-template, `character_unlocks` в overview; `test_level_gates.py`, `test_api_level_gates.py`.
- [ ] P2 **[Backend] ⚠ spec** Альтернативные ветки достижений (долговой vs бездолговой путь, GAME §9.3 п.6).

### Эпик V2 — победа из шаблона

- [x] P1 **[Backend]** Движок **M из N** по `victory_config_json`; `avg_liquid_delta_6p` / зарплата в порогах — `victory_engine.py`, миграция `0010`, `test_victory_engine.py`.
- [x] P1 **[Backend]** `min_period_index_for_victory` из шаблона (дефолт 7) — в overview `victory.*`.

### События и контент (после M11)

- [ ] P1 **[Backend]** Логика `mandatory_gate` (`blocks_period_end`) — колонка есть, поведение в `choose` / конец периода не описано в spec.
- [ ] P2 **[Backend] ⚠ spec** Предикаты событий: страховка / актив / инвестиция; цепочки событий.
- [ ] P2 **[Backend] ⚠ spec** Баланс 🟢🔴🟡 от **финансового здоровья**, не только от уровня (GAME §9.1 п.3).
- [ ] P2 **[Backend] ⚠ spec** Макро-события (ставка, кризис) с 5–6 уровня (GAME §1.9, §9.3 п.7).

### Эпик A0 — Admin Watchtower (MVP 1.2)

Идея: [`admin-and-notifications.md`](../vision/ideas/admin-and-notifications.md) · Phase 0 = ops-наблюдаемость при низком DAU.

- [x] P0 **[DB]** `notification_log` — миграция `0012_notification_log.sql`.
- [x] P0 **[Backend]** `emit_admin_alert`, hooks: register, profile, game start, period (win/loss/milestone), Telegram ops.
- [x] P0 **[Backend]** `GET /api/admin/watchtower` + allowlist `ADMIN_USER_IDS`.
- [x] P0 **[Frontend]** Экран `#/admin` Watchtower (read-only).
- [ ] P1 **[Backend+Frontend]** Player inbox (Phase 1 idea).
- [ ] P2 **[Backend+Frontend]** Draft/publish контента и «отправить себе» (Phase 2 idea).
- [ ] P2 **[Doc]** Spec [`SPEC_admin-and-notifications.md`](../specs/features/SPEC_admin-and-notifications.md).

**Env (backend):** `ADMIN_USER_IDS`, `OPS_TELEGRAM_BOT_TOKEN`, `OPS_TELEGRAM_CHAT_ID`; ссылки в TG — `ADMIN_WEB_BASE_URL` или `PUBLIC_APP_URL` (на Render без env — дефолт GitHub Pages).

### Эпик E1 — расходы на жизнеобеспечение (полный слой)

**Проблема:** в симуляторе отсутствует слой регулярных трат на жизнь (еда, жильё, одежда, связь…) — есть только скрытый агрегат `base + delta`.

Идея (idea-refine): [`expenses-mechanic.md`](../vision/ideas/expenses-mechanic.md) · Канон: [`EXPENSES_SYSTEM.md`](../specs/gameplay/EXPENSES_SYSTEM.md) · Spec: [`SPEC_expenses.md`](../specs/features/SPEC_expenses.md) · Plan: [`PLAN_expenses.md`](../plans/PLAN_expenses.md) · **Чеклист слоёв:** [`EXPENSES_LAYER_CHECKLIST.md`](../specs/economy/EXPENSES_LAYER_CHECKLIST.md).

#### Волна A — логическая правда (P0)

- [ ] P0 **[DB] E1-110–111** — каталог категорий + `profile_expense_lines`.
- [ ] P0 **[Backend] E1-112** — `expenses.py` (`compute_monthly_burn`, breakdown).
- [ ] P0 **[DB+Backend] E1-114** — `expense_budget` во всех game templates (sum = base).
- [ ] P0 **[Backend] E1-113** — `game/start` создаёт статьи из blueprint.
- [ ] P0 **[Backend] E1-115** — `process_period_end` + breakdown по категориям.
- [ ] P0 **[Backend] E1-116** — overview: burn, breakdown, `total_monthly_outflow`.
- [ ] P1 **[Backend] E1-117** — backfill legacy профилей.
- [ ] P1 **[Backend] E1-118** — achievements + victory hooks.

#### Волна B — видимость (P1)

- [ ] P1 **[Frontend] E1-210–214** — api, дашборд, экран «Расходы», итог периода, design-lab.

#### Волна C — контент и цели (P1–P2)

- [ ] P1 **[Backend] E1-310–311** — effects `expense_line` + сиды событий.
- [ ] P1 **[Backend+FE] E1-312–314** — victory `expense_to_income_ratio`, analytics.

#### Волна D — Plan Mode (P2, после Game)

- [ ] P2 **[Spec+BE+FE] E1-410–412** — редактор статей, префилл.

### Экономика и давление

- [ ] P1 **[Backend] ⚠ spec** Штрафы / проценты на просрочку (флаг шаблона или Plan-only).
- [ ] P1 **[Backend] ⚠ spec** Налоги / упрощённая отчётность периода (GAME §1.2, уровень 9 «Стратег»).
- [ ] P2 **[Backend] ⚠ spec** Аннуитет / дифференцированный платёж по кредиту (GAME §1.6).
- [ ] P2 **[Backend] ⚠ spec** Превью последствий на сервере для ползунков (сумма кредита, вклад) — GAME §3.6.
- [ ] P2 **[Backend] ⚠ spec** «Банкротство» / второй шанс с последствиями (GAME §2.6).
- [ ] P3 **[Backend]** Кредитный скоринг / репутация; сезонность ставок.

### Plan Mode (MVP 2.0)

- [ ] P1 **[Backend]** `starter_params_json` и префилл новой Plan из снимка — evolution §II.3; **не G1**.

### API и качество

- [ ] P1 **[Backend]** Идempotency для денежных POST (`claim-salary`, подушка, покупки).
- [ ] P1 **[Backend]** Валидация старта игры — понятные 4xx вместо 500.
- [ ] P1 **[Backend]** Контрактные тесты: старт, конец периода, победа, achievements.
- [ ] P2 **[Backend]** Единый формат ошибок API (`code`, `message`, `details`).
- [ ] P2 **[Backend]** Rate limit на чувствительные эндпоинты.
- [ ] P2 **[Backend]** Healthcheck с latency PostgreSQL.
- [ ] P2 **[Backend]** Юнит-тесты `game_period.py` на фикстурах.
- [ ] P3 **[Backend]** Версионирование `/api/v1`, OpenAPI/SDK.

### Страховки (I1)

- [ ] P1 **[Backend]** Завершить claim payout по `payout_amount`, деактивация полиса (`0008` комментарий).
- [ ] P2 **[Backend]** Связка страховых событий с `product` / `insured_object`.

---

## Frontend (TMA, UI/UX)

### Сделано

- [x] HUD времени, модал конца периода, тосты, финансы по вкладкам, события (карусель).
- [x] Поток Game: `NewProfileKindScreen` → `GameTemplatePickScreen` (Plan — заглушка).
- [x] **MQ-108**, **MQ-116 (часть)** — блок уровень/XP на дашборде (`DashboardPremium`, `character_*` из overview).

### MVP 1.1 / прогрессия

- [ ] P1 **[Frontend]** Экран **«Развитие»**: достижения, цепочки, недавние unlock — GAME §10.5, §11.1; API achievements есть, UI ⬜.
- [ ] P1 **[Frontend]** Level-up feedback (тост / оверлей) при смене `character_level`.
- [ ] P2 **[Frontend] ⚠ spec** Бейджи `game` / `plan` и сложность шаблона в списке сохранений (GAME §12, §13).

### Эпик O1 — онбординг TMA (Pre-Alpha)

Идея: [`onboarding-tma-mission-brief.md`](../vision/ideas/onboarding-tma-mission-brief.md) · Spec: [`SPEC_onboarding-tma.md`](../specs/features/SPEC_onboarding-tma.md) · Plan: [`PLAN_onboarding-tma.md`](../plans/PLAN_onboarding-tma.md)

- [ ] P0 **[Doc+Design]** **Раунд 1:** `design-lab/onboarding-brief/` — выбор варианта **A–F** + копирайт с **Монеткой** ([`CHARACTER_MONETKA.md`](../reference/CHARACTER_MONETKA.md)).
- [ ] P0 **[Doc]** Spec O1 → `approved` после «утверждаем X».
- [ ] P0 **[Frontend]** MQX overlay по утверждённому варианту ([`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md)).
- [ ] P0 **[Backend]** `onboarding_state`: `draft` на start, `PATCH /api/game/profile/onboarding`, поле в overview.
- [ ] P0 **[Frontend]** Показ брифа после `GameTemplatePick` / до игры; Skip + «Начать».
- [ ] P1 **[Frontend]** Coach marks периода 1 — **волна 2** (отдельный design-lab).
- [ ] P0 **[Frontend]** «Повторить обучение» в меню (фаза 2 плана O1).

### Онбординг и обучение (GAME §3.4, §9.3, §11)

- [ ] P1 **[Frontend] + [Doc]** Онбординг **3 шага** — см. эпик **O1** выше (заменяет размытую строку).
- [ ] P1 **[Frontend]** Пустые состояния с CTA («нет активов → шаблон»).
- [ ] P2 **[Frontend]** Coach marks после первого входа.
- [ ] P2 **[Frontend]** Глоссарий «?» на инструментах (вклад vs cash, купон, подушка) — GAME §9.3 п.1.
- [ ] P2 **[Frontend]** Прогресс победы MVP — шкала из `overview`.
- [ ] P2 **[Frontend]** Локализация `kind` активов / типов (словарь RU).
- [ ] P2 **[Frontend] ⚠ spec** «Карта финансового здоровья» (radar: защита, доход, долг, благополучие) — GAME §4.5; данные частично в analytics.
- [ ] P2 **[Frontend] ⚠ spec** Карточки инструментов: 2–3 свойства + иконки 🛡️💰🔒⚡ (GAME §3.3).
- [ ] P2 **[Frontend]** Skeleton / shimmer первой загрузки.
- [ ] P2 **[Frontend]** Единая шапка с балансами при смене вкладки.
- [ ] P2 **[Frontend]** Офлайн / retry при таймауте TMA.
- [ ] P3 **[Frontend] ⚠ spec** Дневник персонажа (постфактум, GAME §3.7).
- [ ] P3 **[Frontend] ⚠ spec** «Быстрый период» для ветеранов (GAME §6.3).
- [ ] P3 **[Frontend] ⚠ spec** Персонаж с репликами (GAME §9.3 п.9).
- [ ] P3 **[Frontend]** Настройки a11y (крупный шрифт, меньше анимаций).

### Страховки (I1)

- [ ] P1 **[Frontend]** Каталог продуктов / picker / карточки плана (design-lab → прод).
- [ ] P2 **[Frontend]** Метрики полиса и сравнение планов в `FinanceSection`.

### Plan Mode UI

- [ ] P1 **[Frontend] + [Doc]** Мастер Plan, префилл — заглушка «Скоро» → полный поток; spec нет.

### Дизайн / бренд

- [ ] P1 **[Frontend]** Статусные цвета просрочки / успех / таймер по BRANDBOOK.
- [ ] P1 **[Frontend]** `tabular-nums` для всех KPI.
- [ ] P2 **[Frontend]** Согласование Quest Violet с `tg-theme` на hero-кнопках.
- [ ] P3 **[Frontend]** Hero / онбординг-иллюстрация; паттерн «сетка периода».

### Качество

- [ ] P1 **[Frontend]** E2E smoke: логин → игра → вкладка финансов.
- [ ] P2 **[Frontend]** Haptic на главных CTA (Telegram Web App API).

---

## Doc (спеки, ADR, продукт, исследования)

### Есть spec / plan — вести и не дублировать в GAME

- [x] G1 — [`SPEC_game-plan`](../specs/features/SPEC_game-plan.md), [`PLAN_game-plan`](../plans/PLAN_game-plan.md).
- [x] M11 — [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md) **approved**; [`LEVEL_XP_SYSTEM`](../specs/gameplay/LEVEL_XP_SYSTEM.md).
- [ ] P0 **[Doc]** Обновить **GAME.md §0.2**: `cooldown_periods` ✅; M11 ✅; достижения 🟡; ссылка на этот бэклог.
- [ ] P0 **[Doc]** Закрыть приёмку M11 в [`MVP_AUDIT_VS_SPEC`](../foundation/MVP_AUDIT_VS_SPEC.md) + статус **implemented** в TRACEABILITY.

### Нужен spec или углубление (⚠ из GAME)

| Тема | GAME | Действие |
|------|------|----------|
| Достижения M12 | §5.3, §10.5 | [SPEC_achievements](../specs/features/SPEC_achievements.md); UI «Развитие» |
| Victory v2 | §1.8, §13 | Spec движка целей; связь с `victory_config` |
| Plan Mode | §1.10, §13 | Spec мастера + префилл (отдельно от G1) |
| `mandatory_gate` | §13 | Дополнение SPEC событий или ADR |
| Онбординг 3 шага | §0.2, §12 | Spec UX + копирайт; чеклист Pre-Alpha §11.1 |
| API-gates по уровню | §5.4, LEVEL_XP §8 | Матрица «уровень → эндпоинт» в LEVEL_XP или SPEC |
| Штрафы просрочки | §13 | Idea → spec давления |
| Налоги / ИИС / пенсия | §5.4 ур.9 | Idea-refine, вне MVP |
| Главы-кампания | §4.1–4.3 | Vision-doc; шаблоны как замена части «глав» |
| Retention / α-гейты | §11 | **Doc:** протокол плейтеста Pre-Alpha (10–20), метрики D1/D7 для Closed Alpha |
| Product analytics | §11.2 | Выбор Amplitude/Firebase/своё — ADR |
| Темп XP анкета vs код | §5.4, §6.2 | Сверка таблицы анкеты с `need(L)` — decision log в LEVEL_XP |
| Соц. механики | §8.1 | Idea: NPC, бенчмарки — низкий приоритет |
| Монетизация Soft Launch | §11.3 | TBD product |

- [x] P1 **[Doc]** [SPEC_achievements.md](../specs/features/SPEC_achievements.md) — цепочки, `criteria_json`, API, прокси v1.0.
- [ ] P1 **[Doc]** **`PLAN_achievements.md`** + эпик **M12** в TRACEABILITY.
- [ ] P1 **[Doc]** **`SPEC_victory-v2.md`** — M из N, поля config, UI прогресса целей.
- [ ] P1 **[Doc]** Протокол **Pre-Alpha** плейтеста: чеклист готовности ([`GAME.md`](../../GAME.md) раздел 11.1), опрос понимания вклад/подушка, критерий ~80% до 3–4 периода — **черновик:** [`docs/foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md).
- [x] P2 **[Doc]** **`SPEC_onboarding-tma.md`** — черновик: Mission Brief, API, non-goals.
- [ ] P2 **[Doc]** **`SPEC_insurance-catalog.md`** — продукты, объекты, payout (синхрон с 0008 и design-lab).
- [ ] P2 **[Doc]** Vision: **главы жизни** как кампании vs шаблоны (GAME §4).
- [ ] P2 **[Doc]** Редактура текстов событий под тон бренда.
- [ ] P3 **[Doc]** White-label / B2B2C (GAME §8.3) — idea only.

### Контент (можно помечать как Doc+DB)

- [ ] P2 **[Doc] + [DB]** Распределение событий 🟢🔴🟡 по уровням — таблица GAME §7.3 в каталоге контента.
- [ ] P2 **[Doc] + [DB]** Примеры tier 1–2 из GAME §7.6–7.7 — gap-анализ vs `mvp11_event_seeds.py`.

---

## Кросс-слойные эпики (кратко)

| Эпик | DB | Backend | Frontend | Doc |
|------|----|---------|----------|-----|
| G1 Game/Plan | ✅ | ✅ | ✅ Plan stub | ✅ |
| M11 Progression | ✅ | ✅ | 🟡 приёмка UI | ✅ |
| M12 Achievements | 🟡 0009 | ✅ criteria + gates | ⬜ Развитие | ✅ SPEC |
| V2 Victory | ✅ 0010 | ✅ engine | прогресс целей | ✅ SPEC |
| I1 Insurance | ✅ 0008 | 🟡 claim | 🟡 catalog UI | ⚠ SPEC |
| α Playtest | — | — | опрос/метрики | протокол |
| A0 Watchtower | ✅ 0012 | 🟡 Phase 0 | 🟡 `#/admin` | idea |

---

## В работу сейчас

| Приоритет | Пункт | Слой | Ветка / заметка |
|-----------|-------|------|-----------------|
| P0 | A0: env TG + `ADMIN_USER_IDS` на Render | Backend | см. idea §Phase 0 |
| P1 | M12: экран «Развитие» + unlock toasts | Frontend | [SPEC_achievements](../specs/features/SPEC_achievements.md) §11 |
| P0 | Приёмка MQ-116 / тесты M11 | Backend | `pytest -q` ✅ 75 |
| P1 | UI: `character_unlocks`, 403 `level_gate` | Frontend | overview + FinanceSection |
| P1 | Экран «Развитие» | Frontend | `achievements` API |
| P1 | I1: каталог страховок в FinanceSection | Frontend | design-lab |

---

## Журнал

| Дата | Что сделали |
|------|-------------|
| 2026-05-16 | MVP audit; MQ-101–108 (G1). |
| 2026-05-19 | Синхронизация с [`GAME.md`](../../GAME.md): слои DB/BE/FE/Doc; M11 отмечен выполненным в коде; заведены M12, V2, I1, α; пробелы ⚠ spec; исправлена устаревшая пометка про cooldown. |
| 2026-05-19 | **MVP 1.2 / A0:** эпик Admin Watchtower Phase 0 — `notification_log`, ops-алерты, `#/admin`. |
| 2026-05-19 | **Q1** quality-release; **V2** victory engine; **M12** критерии достижений + API level-gates (`level_gates.py`, overview `character_unlocks`). |

---

*Последнее обновление: 2026-05-19 — бэклог по GAME.md и фактическому коду (M11, cooldown, achievements WIP).*
