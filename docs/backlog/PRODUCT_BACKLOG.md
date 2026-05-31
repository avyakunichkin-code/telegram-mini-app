# ТВОЙ ХОД — бэклог и дорожная карта

Живой список работ по слоям **DB / Backend / Frontend / Doc**. Источник идей для этой итерации: **[`GAME.md`](../../GAME.md)** (синтез анкеты, кода, Pre-Alpha → Closed Alpha).

**Трассировка эпиков:** [`TRACEABILITY.md`](../TRACEABILITY.md)  
**Связанные документы:** [`CLAUDE.md`](../../CLAUDE.md), [evolution §II](../vision/ideas/tvoy-hod-evolution-after-mvp.md), [`foundation/SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md), [`foundation/TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md), [`specs/SPEC_ANALYTICS.md`](../specs/SPEC_ANALYTICS.md), [`specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md).

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
| **M11** | MVP 1.1: tier, события, cooldown | DB+Backend+Frontend | ✅ MQ-111–116; без character XP (2026-05-24); плейтест Pre-Alpha — ⬜ |
| **M12** | Достижения / «Развитие» | DB+Backend+Frontend | ⏸ **idea-refine** (2026-05-30): после снятия XP роль UI под вопросом; BE в коде, FE не в scope α |
| **V2** | Victory M из N | DB+Backend+Frontend+Doc | ✅ **P1 закрыт**: `victory_engine` + `MqxGoalDash`; дальше — баланс/плейтест |
| **I1** | Страховки: продукт + объект | DB+Backend+Frontend | ✅ I1-A/B (2026-06-01): покупка, claim, тесты |
| **CN1** | Потребности персонажа (Z‑NEEDS) | DB+Backend+Frontend+Doc | 🟡 ядро ✅ в prod; **доработка контента/UI ⏸** до пересмотра SPEC (2026-05-30) |
| **α** | Pre-Alpha / Closed Alpha гейты | Doc+Frontend (метрики) | ⬜ см. GAME §11 |
| **O1** | Онбординг TMA — Guided coach + Монетка | Frontend+Backend+Doc | 🟡 design-lab ★ → MQX |
| **A0** | Admin Watchtower (MVP 1.2) | DB+Backend+Frontend | 🟡 Phase 0 в коде |
| **TG1** | Telegram: боты, ops, player notify | Ops+Backend+Frontend | ⬜ [`TELEGRAM_BACKLOG.md`](TELEGRAM_BACKLOG.md) |
| **E1** | **Расходы жизнеобеспечения** — категории, статьи, burn, UI | DB+Backend+Frontend+Content | ⏸ **ждём описание + doc**; E1-R и код — после spec ([PLAN](../plans/PLAN_backlog_may2026.md)) |
| **PW1** | PWA / standalone + стабильный resume (lock/unlock) | Frontend+Ops+Doc | 🟡 фаза 0–1 ✅; **PW1-004/104 PASS**; [PLAN](../plans/PLAN_pwa-standalone.md) |
| **AF1** | Воронка «игра → советник» (гипотеза) | Doc+Marketing+Frontend | 🟡 handbook; **Pre-Alpha: без CTA советника** (2026-05-30) |
| **T1** | Пошаговый месяц без таймера (TB1) | DB+Backend+Frontend+Doc | ✅ **implemented** — [idea](../vision/ideas/turn-based-period-no-timer.md) · [plan](../plans/PLAN_turn-based-period-no-timer.md) · TB1.1 чипы — backlog |

> **GAME.md §0.2 / M11:** синхронизировано 2026-05-26 (Task 0.1): `cooldown_periods` ✅, MQ-116 → [`MVP_AUDIT_VS_SPEC`](../foundation/MVP_AUDIT_VS_SPEC.md) §M11.

### Решения продукта (2026-05-30)

| Тема | Решение |
|------|---------|
| **PW1 resume** | PASS — TMA lock/unlock проверен, блокер α снят |
| **CN1 treat-self / polish** | Не в sprint до пересмотра [`SPEC_game-character-needs`](../specs/features/SPEC_game-character-needs.md) и one-pager |
| **M12 «Развитие»** | ⏸ idea-refine с нуля — см. [`achievements-m12-direction.md`](../vision/ideas/achievements-m12-direction.md); экран FE **не** в Pre-Alpha |
| **E1 расходы** | Нужны, но **ждём описание и документацию**; миграции не начинать |
| **Advisor CTA** | **100% без** CTA на советника в Pre-Alpha (только внешний опрос) |
| **Plan Mode** | MVP 2.0, **не** в ближайших волнах |

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
- [x] P1 **[DB]** Victory v2 — `victory_config_json` в шаблонах, сиды 0010+, чистка `character_level` (0031).
- [ ] P1 **[DB] ⚠ spec** Plan Mode — поля префилла / `starter_params_json` на шаблоне или снимке.
- [ ] P2 **[DB] ⚠ spec** События: `prerequisites_json`, `chain_id`, веса 🟢🔴🟡 по уровню (GAME §7.3–7.4) — нет каталога колонок в spec.
- [x] P2 **[DB]** Сиды достижений по GAME §5.3 (6×4) — `achievements/seeds.py`, [SPEC_achievements](../specs/features/SPEC_achievements.md) §7.
- [ ] P2 **[DB]** Расширить сиды событий до 20–25 на tier (рекомендация GAME §8.3) + значения `cooldown_periods` в контенте.
- [ ] P3 **[DB] ⚠ spec** Журнал аудита / product events — таблица или внешняя аналитика.

---

## Backend (API, доменная логика, тесты)

### MVP и G1 / M11 (закрыто в коде)

- [x] Core loop, зарплата, подушка, финансы, инвестиции, страховки, победа MVP, поражение.
- [x] **MQ-112** — `ensure_period_events`: tier \([L−2, L]\), `repeat_policy`, cooldown, fallback.
- [x] **MQ-113** — ~~character_progression~~ **снят**; tier от `period_index` ([`remove-character-xp`](../vision/ideas/remove-character-xp-and-levels.md)).
- [x] **MQ-114** — whitelist эффектов в choose (`monthly_lifestyle_delta`); `xp_delta` **игнорируется**.
- [x] **MQ-115** — overview: `avg_net_cashflow_6p`, блок **`victory`** (без `character_*`).
- [x] P0 **MQ-116 (приёмка)** — tier/cooldown/repeat; без assert level/XP (`test_mq116_acceptance.py`, `test_ensure_period_events.py`).

### Эпик M12 — достижения (из GAME §5)

> **⏸ 2026-05-30:** после снятия character XP/level экран «Развитие» и место достижений в продукте — **на проработку с нуля** ([`achievements-m12-direction.md`](../vision/ideas/achievements-m12-direction.md)). Код BE/API остаётся; новый UI и spec — **не** до idea-refine + обновления SPEC. Pre-Alpha: тосты при unlock допустимы, отдельный экран — **out**.

- [x] **[Backend]** `achievements/engine.py`, хуки в `game_period`, `finance`, `GET /api/achievements` (черновик).
- [x] P0 **[Backend]** Критерии `criteria_json` по tier из GAME §5.3 (без `stub` в сидах); `test_achievements/engine.py`.
- [ ] P2 **[Backend] ⏸ M12** Стабильный контракт `GET /api/achievements` — **после** idea-refine / нового SPEC (не блокер α).
- [x] P1 **[Backend]** API-gates по `character_level` — `level_gates.py`, invest/insurance/finance from-template, `character_unlocks` в overview; `test_level_gates.py`, `test_api_level_gates.py`.
- [ ] P2 **[Backend] ⚠ spec** Альтернативные ветки достижений (долговой vs бездолговой путь, GAME §9.3 п.6).

### Эпик V2 — победа из шаблона

- [x] P1 **[Backend]** Движок **M из N** по `victory_config_json`; `avg_liquid_delta_6p` / зарплата в порогах — `victory/engine.py`, миграция `0010`, `test_victory_engine.py`.
- [x] P1 **[Backend]** `min_period_index_for_victory` из шаблона (дефолт 7) — в overview `victory.*`.
- [ ] P1 **[Doc+Balance] V2-BAL** — Согласовать пороги chain-целей и копирайт с фактической экономикой (**~20–30** первые шаги, **~40–60** полная победа; см. [`TARGET_PLAYER_AND_SESSION`](../foundation/TARGET_PLAYER_AND_SESSION.md) §2.1); balance-playtest + правки `victory_config_json` шаблонов.
- [x] P1 **[Backend]** Снять period gate (`min_period_index_for_victory`) — `victory/engine.py`, миграция `0042`, seeds (2026-06).

### Эпик CN1 — потребности персонажа (Z‑NEEDS)

Документы и решения:
- Spec: [`SPEC_game-character-needs`](../specs/features/SPEC_game-character-needs.md)
- ADR: [`ADR-005`](../decisions/ADR-005-character-needs-state-and-defeat.md), [`ADR-006`](../decisions/ADR-006-treat-self-options-and-cooldown.md)
- UX: [`CHARACTER_NEEDS_UX`](../ux/CHARACTER_NEEDS_UX.md), экраны `docs/ux/screens/character-needs-*.md`
- Lab: `design-lab/character-needs/` (дашборд needs, treat-self и т.п.)

Скоуп (фаза 1): decay 0–100, последствия distressed, treat-self с кулдауном, поражение при 0 три периода подряд, обзор/дашборд/подсказки.

> **⏸ 2026-05-30:** контент treat-self, rescue, polish UI и defeat-screen — **не в sprint** до пересмотра SPEC и one-pager (CN1-001). Ядро в prod играбельно для α.

Очередь (CN1):
- [ ] P0 **[Doc]** CN1-001 — **gate:** каноничный one-pager + пересмотр [`SPEC_game-character-needs`](../specs/features/SPEC_game-character-needs.md) (decay/thresholds/defeat/treat-self).
- [ ] P2 **[Content+DB] ⏸ CN1-010** — `treat_self.options[]` 3–4 на персонажа — **после** CN1-001 / SPEC.
- [ ] P2 **[Backend+Content] ⏸ CN1-011** — Rescue-события + `rescue_event_bias` — **после** SPEC.
- [x] P1 **[Backend+Frontend+Doc] CN1-012** — `needs_delta` в событиях (whitelist, choose, чипы FE); контент 0040.
- [ ] P2 **[Frontend] ⏸ CN1-020** — Полировка дашборда needs — **после** SPEC.
- [ ] P2 **[Frontend+UX/Copy] ⏸ CN1-021** — Тексты distressed / тон — **после** SPEC.
- [ ] P2 **[Backend+Frontend] ⏸ CN1-022** — Defeat UI по needs — **после** SPEC.
- [ ] P2 **[Balance+Doc] ⏸ CN1-030** — Плейтест decay/штрафов — **после** SPEC + волны α.

### Эпик EVT1 — система событий v2 (слоты, типы, цепочки, global)

**Spec (draft):** [`SPEC_event-system-v2-slots-and-taxonomy.md`](../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md)  
**Handbook:** [`EVENTS.md`](../handbook/EVENTS.md) (публично) · [`EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) (коды) · authoring: [`EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md)  
**Связь:** M11-D, CN1-011 (rescue), Pre-Alpha demo coverage.

**Целевая модель периода:** до **2** `period_choice` + до **1** informational + до **1** `needs_risk` (вероятностно) + chain + до **1** global (max ~5; типично 2–3).

| Приоритет | ID | Задача | Acceptance |
|-----------|-----|--------|------------|
| 🔴 P0 | EVT1-001 | **Approve spec** v2 (слоты, audience, global) | Sign-off на [`SPEC_event-system-v2-slots-and-taxonomy.md`](../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) |
| 🔴 P0 | EVT1-010 | **Doc** — `EVENTS.md` + `EVENTS_TERMS_RU` + GLOSSARY: типы, слоты, trade-off (публично); lifecycle/axis — `EVENTS_AGENT` | §1–§6 handbook; без `.cursor` в публичных docs |
| [x] P0 | EVT1-020 | **DB** — `audience_template_keys`, `content_class`, `event_slot` | `0041` + seeds; фильтр пула `period_choice` + audience |
| 🔴 P0 | EVT1-030 | **Backend** — мульти-слот `ensure_period_events` (choice=2 отдельно от informational/needs_risk/global) | CS-1…CS-3 pytest |
| 🔴 P0 | EVT1-031 | **Backend** — `prerequisites_json` v2 + seed validator (`profile`≠`all`) | CS-6; «квартира+ипотека+нет страховки» |
| 🔴 P0 | EVT1-040 | **Frontend** — informational UI (1 кнопка, отдельная карточка/слот) | ≥1 informational в ручном прогоне |
| 🔴 P0 | EVT1-050 | **Content** — 2–3 informational (цепочки + триггеры механик) | YAML в `data/events/mvp11/` |
| 🟡 P1 | EVT1-060 | **Backend+Content** — `needs_risk`: вероятность, эпизоды просадки, отдельный слот | CS-3; `event_profile_needs_risk_episodes` |
| 🟡 P1 | EVT1-070 | **Backend** — планировщик `global_macro` (period≥10, cooldown 10–15) | CS-5 pytest |
| 🟡 P1 | EVT1-080 | **Content** — 2 global macro (ставка ↑/↓ или локальный кризис) | informational + metadata `economy_patch` stub |
| 🟡 P1 | EVT1-090 | **Content+Backend** — ≥3 цепочки с отсылкой к выбору в тексте | family_money, used_car + 1 новая (курсы→коллега) |
| 🟡 P1 | EVT1-091 | **API** — `event_slot`, `chain_context`, `period_slots_summary` в pending | FE может группировать |
| 🟡 P1 | EVT1-100 | **Content** — demo coverage: universal + profile + instrumental по 2+ на Student/Pro | Чеклист для α |
| [x] P1 | EVT1-105 | **Content+Analysis** — ребаланс каталога: §1–4 (baseline 31→0) + **§10 lifecycle** + **§11 axis** | 2026-05-30: `mvp11` YAML + `balance_contract` |
| [x] P1 | EVT1-106 | **Backend** — `balance_contract.py` + pytest (**§1/§3**; skip insurance/used_car Pareto) | baseline **0**; §10/§11 — audit в EVT1-105 |
| 🟢 P2 | EVT1-110 | **Backend** — баланс 🟢🔴🟡 от фин. здоровья (не tier) | [`event-types-and-taxonomy.md`](../vision/ideas/event-types-and-taxonomy.md) |
| 🟢 P2 | EVT1-120 | **Analytics** — вовлечённость по `event_domain` | Watchtower / export |
| 🟢 P2 | EVT1-130 | **Economy** — применение `economy_patch` от macro к ставкам | Отдельный slice после stub |

**Legacy (закрыто / перенесено в EVT1):**

- [x] P1 **[Backend]** Цепочки MVP: `event_profile_chains`, авто, родственник — миграции `0020`–`0025`.
- [x] P1 **[Backend]** Пул: ротация `event_domain`, fatigue, кулдауны — `EVENT_TAXONOMY`.
- [x] P1 **[Backend]** `mandatory_gate` `blocks_period_end` — prod в `mandatory.py` + `time/next`.
- [ ] ~~P3 informational лотерея~~ → **EVT1-050** (отдельный слот).
- [ ] ~~P2 макро 5–6 lvl~~ → **EVT1-070/080/130** (period 10+, cooldown 10–15).

### Эпик A0 — Admin Watchtower (MVP 1.2)

Идея: [`admin-and-notifications.md`](../vision/ideas/admin-and-notifications.md) · Phase 0 = ops-наблюдаемость при низком DAU.

- [x] P0 **[DB]** `notification_log` — миграция `0012_notification_log.sql`.
- [x] P0 **[Backend]** `emit_admin_alert`, hooks: register, profile, game start, period (win/loss/milestone), Telegram ops.
- [x] P0 **[Backend]** `GET /api/admin/watchtower` + allowlist `ADMIN_USER_IDS`.
- [x] P0 **[Frontend]** Экран `#/admin` Watchtower (read-only).
- [ ] P1 **[Doc+Ops]** План ops-аналитики — [`PLAN_admin-analytics-ops.md`](../plans/PLAN_admin-analytics-ops.md).
- [x] P1 **[Backend+Frontend]** A1: онбординг в Watchtower + emit brief_done/skip/step + воронка в `#/admin`.
- [ ] P1 **[Backend+Frontend]** A2: `GET /api/admin/metrics/summary` + KPI карточки.
- [ ] P1 **[Backend+Frontend]** A3: profile inspector.
- [ ] P2 **[Backend+Frontend]** Player inbox (Phase 1 idea).
- [ ] P2 **[Backend+Frontend]** Draft/publish контента и «отправить себе» (Phase 2 idea).
- [ ] P2 **[Doc]** Spec [`SPEC_telegram-bots-and-notifications.md`](../specs/features/SPEC_telegram-bots-and-notifications.md) · бэклог [`TELEGRAM_BACKLOG.md`](TELEGRAM_BACKLOG.md).

**Env (backend):** `ADMIN_USER_IDS`, `OPS_TELEGRAM_BOT_TOKEN`, `OPS_TELEGRAM_CHAT_ID`; ссылки в TG — `ADMIN_WEB_BASE_URL` или `PUBLIC_APP_URL` (на Render без env — дефолт GitHub Pages).

### Эпик E1 — расходы на жизнеобеспечение (полный слой)

**Статус (2026-05-30):** реализация **на паузе** — сначала **описание фичи и документация**, затем E1-R ([`PLAN_backlog_may2026`](../plans/PLAN_backlog_may2026.md): E1-R1…R3). Волны A–D — **после go**, не раньше.

**Проблема:** в симуляторе отсутствует слой регулярных трат на жизнь (еда, жильё, одежда, связь…) — есть только скрытый агрегат `base + delta`.

Идея (idea-refine): [`expenses-mechanic.md`](../vision/ideas/expenses-mechanic.md) · Канон: [`EXPENSES_SYSTEM.md`](../specs/gameplay/EXPENSES_SYSTEM.md) · Spec: [`SPEC_expenses.md`](../specs/features/SPEC_expenses.md) · Plan: [`PLAN_expenses.md`](../plans/PLAN_expenses.md) · **Чеклист слоёв:** [`EXPENSES_LAYER_CHECKLIST.md`](../specs/economy/EXPENSES_LAYER_CHECKLIST.md).

#### E1-R — повторная аналитика (сейчас)

- [ ] P0 **[Doc+Analytics] E1-R1** — снимок экономики: шаблоны × burn/outflow/victory до и после E1.
- [ ] P0 **[Doc] E1-R2** — gap spec ↔ код ↔ UX; обновить SPEC + LAYER_CHECKLIST.
- [ ] P0 **[Doc] E1-R3** — решение go / reshape / defer; обновить PLAN_expenses + TASKS_expenses.

#### Волна A — логическая правда (P0, после E1-R go)

- [ ] P0 **[DB] E1-110–111** — каталог категорий + `profile_expense_lines`.
- [ ] P0 **[Backend] E1-112** — `finance/expenses.py` (`compute_monthly_burn`, breakdown).
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
- [ ] P2 **[Backend]** Юнит-тесты `game/period.py` на фикстурах.
- [ ] P3 **[Backend]** Версионирование `/api/v1`, OpenAPI/SDK.

### Страховки (I1)

- [x] P1 **[Backend]** Claim payout по `payout_amount`, деактивация полиса — `insurance_hooks.py`, `test_insurance_events.py` (2026-06-01).
- [ ] P2 **[Backend]** Связка страховых событий с `product` / `insured_object` (контент `auto.yaml`, `housing.yaml`).

---

## Frontend (TMA, UI/UX)

### Сделано

- [x] HUD времени, модал конца периода, тосты, финансы по вкладкам, события (карусель).
- [x] Поток Game: `NewProfileKindScreen` → `GameTemplatePickScreen` (Plan — заглушка).
- [x] **MQ-108** — дашборд без legacy `character_*`; прогресс победы — см. V2 UI.

### MVP 1.1 / прогрессия

- [ ] P3 **[Frontend] ⏸ M12** Экран **«Развитие»** — **out of Pre-Alpha**; idea-refine [`achievements-m12-direction.md`](../vision/ideas/achievements-m12-direction.md).
- [x] P1 **[Frontend] V2** — UI целей из `overview.victory` (`MqxGoalDash`, `victoryGoalDisplay.js`) — architecture-review Q&A 2026-05-25.
- [ ] P2 **[Frontend] ⚠ spec** Бейджи `game` / `plan` и сложность шаблона в списке сохранений (GAME §12, §13).

### Эпик O1 — онбординг TMA (Pre-Alpha)

Идея: [`onboarding-tma-mission-brief.md`](../vision/ideas/onboarding-tma-mission-brief.md) · Spec: [`SPEC_onboarding-tma.md`](../specs/features/SPEC_onboarding-tma.md) · Plan: [`PLAN_onboarding-tma.md`](../plans/PLAN_onboarding-tma.md) · Lab: [`onboarding-guided/`](../design-lab/onboarding-guided/)

- [x] P0 **[Doc+Design]** Guided coach **5 шагов ★** — [`onboarding-guided/APPROVED.md`](../design-lab/onboarding-guided/APPROVED.md).
- [x] P0 **[Doc]** Spec O1 → guided coach (2026-05-20).
- [x] P0 **[Doc]** Ассет Монетки: [`docs/reference/assets/monetka-mascot.png`](../reference/assets/monetka-mascot.png).
- [x] P0 **[Product+Frontend]** Автостарт **простейшего** шаблона после Game Mode (`startGameWithSimplestTemplate`).
- [x] P0 **[Frontend]** MQX `OnboardingCoach` + `GameOnboardingLayer` на `GameScreen`.
- [x] P0 **[Backend]** `onboarding_state` + `onboarding_step`; `PATCH /api/game/profile/onboarding`; overview.
- [x] P0 **[Frontend]** Coach: практика 10 с без UI; гейты зарплата/подушка; skip×2; шаг 5 «Начать игру».
- [ ] P1 **[Frontend]** «Повторить обучение» — фаза 2 (после метрик).

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

### Эпик PW1 — PWA / standalone + resume после блокировки экрана

**Проблема:** в TMA при lock/unlock UI и балансы расходятся с сервером (TB1: без секундомера, но resync всё ещё нужен). См. [`pwa-standalone-channel.md`](../vision/ideas/pwa-standalone-channel.md) · Plan: [`PLAN_pwa-standalone.md`](../plans/PLAN_pwa-standalone.md).

#### Фаза 0 — lifecycle (улучшает TMA сразу)

- [x] P1 **[Frontend] PW1-001** — `visibilitychange` / focus → `refreshGameState()` в `useGame` (`appLifecycle.js`, `useGame.js`); TB1: без клиентского секундомера.
- [x] P1 **[Frontend] PW1-002** — debounce resync; `periodEndInFlightRef` — не дублировать `setTimeNext`.
- [x] P1 **[Doc] PW1-003** — [`PW1_RESUME_PLAYTEST_CHECKLIST.md`](../foundation/PW1_RESUME_PLAYTEST_CHECKLIST.md); Pre-Alpha §3 + опрос §6.8.
- [x] P1 **[QA] PW1-004** — resume TMA lock/unlock PASS (2026-05-30, product); §0a auto ✅ 2026-05-26; [checklist](../foundation/PW1_RESUME_PLAYTEST_CHECKLIST.md).

#### Фаза 1 — installable PWA

- [x] P1 **[Frontend] PW1-101** — `public/pwa/` иконки из `landing/public/brand/logo-compact.png`.
- [x] P1 **[Frontend] PW1-102** — `vite-plugin-pwa`: manifest, SW, precache (`vite.config.js`).
- [x] P1 **[Frontend+Ops] PW1-103** — `start_url` `…/#/`; meta + apple-touch; [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md).
- [x] P1 **[Backend+Ops] PW1-104** — CORS origin для prod PWA; `VITE_API_BASE_URL` в CI (`deploy-app.yml` + приёмка: install Safari iOS → игра, 2026-06-01).
- [ ] P2 **[Doc] PW1-105** — черновик `SPEC_pwa-standalone.md` после фазы 0.

#### Фаза 2 — standalone UX (позже)

- [ ] P2 **[Frontend] PW1-201** — `isTelegramEnvironment()` + безопасные обёртки TG API.
- [ ] P2 **[Frontend] PW1-202** — копирайт и баннер «Установить» / «Открыть в браузере».
- [ ] P3 **[Frontend] ⚠ spec** Дневник персонажа (постфактум, GAME §3.7).
- [ ] P3 **[Frontend] ⚠ spec** «Быстрый период» для ветеранов (GAME §6.3).
- [ ] P3 **[Frontend] ⚠ spec** Персонаж с репликами (GAME §9.3 п.9).
- [ ] P3 **[Frontend]** Настройки a11y (крупный шрифт, меньше анимаций).

### Эпик T1 — пошаговый месяц без таймера (✅ TB1, 2026-05-26)

Идея: [`turn-based-period-no-timer.md`](../vision/ideas/turn-based-period-no-timer.md) · Plan: [`PLAN_turn-based-period-no-timer.md`](../plans/PLAN_turn-based-period-no-timer.md) · Lab ★: [`hero-no-timer-round/`](../../design-lab/dashboard/hero-no-timer-round/).

- [x] P2 **[Backend] T1-1** — `sync_time` не увеличивает `period_index`; переход через `time/next` → `process_period_end`.
- [x] P2 **[Frontend] T1-2** — hero H2: «Закрыть месяц» + pill «События»; без countdown / auto-next / play-pause.
- [x] P2 **[Doc] T1-3** — `dashboard.md`, SPEC §3.1, TRACEABILITY, GLOSSARY, PW1 checklist (TB1).
- [ ] P2 **TB1.1** — чипы плана месяца в hero (отдельный эпик, не блокер TB1).

### Страховки (I1)

Спринт: **I1-A** покупка · **I1-B** claim — см. [`PLAN_backlog_may2026`](../plans/PLAN_backlog_may2026.md) Task 1.3–1.4.

- [x] P1 **[Frontend] I1-A** — Каталог / picker / карточки плана; unlock `capital_insurance`; locked hint + тосты ApiError (2026-06-01).
- [x] P1 **[Backend+Frontend] I1-B** — Claim: `insurance_claim` в событиях, payout на cash, тост + pytest buy/claim/cancel (2026-06-01).
- [ ] P2 **[Frontend]** Метрики полиса и сравнение планов в `FinanceSection`.

### Plan Mode UI

- [ ] P1 **[Frontend] + [Doc]** Мастер Plan, префилл — заглушка «Скоро» → полный поток; spec нет.

### Дизайн / бренд

- [ ] P1 **[Frontend]** Статусные цвета просрочки / успех / предупреждения по BRANDBOOK.
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
- [x] M11 — [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md) **implemented**; character XP снят ([remove-character-xp](../vision/ideas/remove-character-xp-and-levels.md)).
- [x] P0 **[Doc]** **GAME.md §0.2** и §5–6 синхронизированы (2026-05-26).
- [x] P0 **[Doc]** Закрыть приёмку M11 в [`MVP_AUDIT_VS_SPEC`](../foundation/MVP_AUDIT_VS_SPEC.md) + статус **implemented** в TRACEABILITY — 2026-05-26 Task 0.1.

### Нужен spec или углубление (⚠ из GAME)

| Тема | GAME | Действие |
|------|------|----------|
| Достижения M12 | §5.3, §10.5 | [SPEC_achievements](../specs/features/SPEC_achievements.md); UI «Развитие» |
| Victory v2 | §1.8, §13 | Spec движка целей; связь с `victory_config` |
| Plan Mode | §1.10, §13 | Spec мастера + префилл (отдельно от G1) |
| `mandatory_gate` | §13 | Дополнение SPEC событий или ADR |
| Онбординг 3 шага | §0.2, §12 | Spec UX + копирайт; чеклист Pre-Alpha §11.1 |
| ~~API-gates по уровню~~ | — | **Снято** → `mechanics_unlock` ([ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md)) |
| Штрафы просрочки | §13 | Idea → spec давления |
| Налоги / ИИС / пенсия | анкета | Idea-refine, вне MVP |
| Главы-кампания | §4.1–4.3 | Vision-doc; шаблоны как замена части «глав» |
| Retention / α-гейты | §11 | **Doc:** протокол плейтеста Pre-Alpha (10–20), метрики D1/D7 для Closed Alpha |
| Product analytics | §11.2 | Выбор Amplitude/Firebase/своё — ADR |
| ~~Темп XP анкета vs код~~ | — | **Не актуально** (level/XP сняты); темп сессии — [`TARGET_PLAYER_AND_SESSION`](../foundation/TARGET_PLAYER_AND_SESSION.md) |
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
- [ ] P2 **[Doc] + [DB]** Примеры tier 1–2 из GAME §7.6–7.7 — gap-анализ vs `events/mvp11_seeds.py`.

---

## Кросс-слойные эпики (кратко)

| Эпик | DB | Backend | Frontend | Doc |
|------|----|---------|----------|-----|
| G1 Game/Plan | ✅ | ✅ | ✅ Plan stub | ✅ |
| M11 Progression | ✅ | ✅ | 🟡 приёмка UI | ✅ |
| M12 Achievements | 🟡 0009 | ✅ engine (legacy) | ⏸ UI idea-refine | ⏸ SPEC пересмотр |
| V2 Victory | ✅ 0010 | ✅ engine | прогресс целей | ✅ SPEC |
| I1 Insurance | ✅ 0008 | ✅ buy/claim | ✅ catalog UI | ⚠ SPEC |
| α Playtest | — | — | опрос/метрики | протокол |
| A0 Watchtower | ✅ 0012 | 🟡 Phase 0 | 🟡 `#/admin` | idea |
| TG1 Telegram | — | ⬜ этапы 0–1 | ⬜ player bot | [TELEGRAM_BACKLOG](TELEGRAM_BACKLOG.md) |
| PW1 PWA / resume | — | — | фаза 0–1 | idea+plan |
| T1 Turn-based (TB1) | ✅ sync_time | ✅ hero H2 | ✅ | idea + plan + dashboard UX |

**План нарезки (май 2026):** [`PLAN_backlog_may2026.md`](../plans/PLAN_backlog_may2026.md)

---

## В работу сейчас

Синхронизировано с решениями **2026-05-30** и [`PLAN_backlog_may2026.md`](../plans/PLAN_backlog_may2026.md).

| Приоритет | Task ID | Пункт | Слой |
|-----------|---------|-------|------|
| **P0** | **0.3** | **Pre-Alpha PA-W1-2026-06:** деплой → опрос → 10–20 приглашений — [`PRE_ALPHA_WAVE1_OPS`](PRE_ALPHA_WAVE1_OPS.md) | Product |
| P1 | 1.6 | A0 env Render (`ADMIN_*`, ops TG) + **TG-001…005** | Ops |
| P1 | 1.7 | **TG1** player bot: BotFather + webhook `/start` (этап 1) | Ops+Backend |
| — | CN1-001 | One-pager + пересмотр SPEC needs (**gate** для CN1 контента) | Doc |
| — | M12 | Idea-refine «Развитие» — [`achievements-m12-direction`](../vision/ideas/achievements-m12-direction.md) | Doc |
| — | E1 | Описание фичи + doc (**gate** для E1-R) | Doc |
| ⏸ | E1-R, M12 FE, CN1-010+ | После gate-доков | — |
| ⏸ | Plan Mode | MVP 2.0 | — |
| ⏸ | AF1 CTA | **Нет** in-app CTA советника в Pre-Alpha | — |
| P2 | 2.x | Watchtower metrics + inspector (после α) | Backend+Frontend |
| — | TB1.1 | Чипы плана месяца — backlog | Frontend |

**Закрыто:** PW1-004 ✅ (2026-05-30); PW1-104 ✅ (2026-06-01); **I1-A / I1-B** ✅ (2026-06-01).

---

## Журнал

| Дата | Что сделали |
|------|-------------|
| 2026-05-16 | MVP audit; MQ-101–108 (G1). |
| 2026-05-19 | Синхронизация с [`GAME.md`](../../GAME.md): слои DB/BE/FE/Doc; M11 отмечен выполненным в коде; заведены M12, V2, I1, α; пробелы ⚠ spec; исправлена устаревшая пометка про cooldown. |
| 2026-05-19 | **MVP 1.2 / A0:** эпик Admin Watchtower Phase 0 — `notification_log`, ops-алерты, `#/admin`. |
| 2026-05-19 | **Q1** quality-release; **V2** victory engine; **M12** критерии достижений + API level-gates (`level_gates.py`, overview `character_unlocks`). |
| 2026-05-25 | **PW1:** эпик PWA/standalone — драйвер нестабильный resume TMA при блокировке экрана; фаза 0 (lifecycle resync) перед install prompt. |
| 2026-05-26 | **План май 2026:** [`PLAN_backlog_may2026`](../plans/PLAN_backlog_may2026.md); E1 → E1-R (аналитика); T1 в сводку (⏸); I1 → A/B; «В работу сейчас» пересобран. |
| 2026-05-26 | **TB1:** T1 implemented — backend `sync_time`, hero «Закрыть месяц», docs dashboard/SPEC/TRACEABILITY. |
| 2026-05-26 | **Task 0.1:** GAME §0.2, MVP_AUDIT §M11, TRACEABILITY M11/E1/T1 — doc приёмка MQ-116. |
| 2026-05-30 | **TG1:** бэклог Telegram — [`TELEGRAM_BACKLOG.md`](TELEGRAM_BACKLOG.md), spec [`SPEC_telegram-bots-and-notifications.md`](../specs/features/SPEC_telegram-bots-and-notifications.md). |
| 2026-05-30 | **Решения продукта:** PW1-004 PASS; M12/CN1/E1 ⏸ до doc; Plan MVP 2.0; Pre-Alpha **без CTA советника**; «В работу сейчас» → α + I1. |
| 2026-06-01 | **PW1-104 PASS:** prod PWA (Safari iOS, «На экран Домой») → login → игра; CI `VITE_API_BASE_URL` в `deploy-app.yml`. |
| 2026-06-01 | **Pre-Alpha PA-W1:** ops-лист обновлён, smoke 2026-06-01, шаблон [`PRE_ALPHA_WAVE1_RESULTS.md`](PRE_ALPHA_WAVE1_RESULTS.md). |
| 2026-05-26 | Документация: уборка `docs/`, `GAME.md` §5–6; M11/level-gates — история, не активный трек. |

---

*Последнее обновление: 2026-06-01 — PW1-104 PASS (PWA prod).*
