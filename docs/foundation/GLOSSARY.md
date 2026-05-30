# Глоссарий ТВОЙ ХОД

Единые термины для foundation, spec и UI. При добавлении поля в API — обновлять здесь и в [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md).

| Термин | Значение | Код / API |
|--------|----------|-----------|
| **Период** | Игровой «месяц» (пошаговый ход, TB1): открыт до **«Закрыть месяц»** | `period_index`; `period_duration_seconds` — legacy в БД |
| **Cash** | Операционный счёт игрока | `cash_balance` |
| **Подушка** | Резерв безопасности | `safety_fund_balance` |
| **Обязательства** | Платежи по долгам + обслуживание активов | `total_monthly_obligations` |
| **Просрочка** | Неоплаченный остаток по долгу | `overdue_amount` |
| **Чистый денежный поток** | Доход − обязательства (долги + обслуживание активов); **без** burn жизни | `net_monthly_cashflow` |
| **Расходы (burn)** | Ежемесячные траты на жизнеобеспечение (еда, жильё, …) | `monthly_burn_total`, `profile_expense_lines` *(E1)* |
| **Статья расходов** | Строка бюджета: категория + сумма/мес | `profile_expense_lines` *(E1)* |
| **monthly_reference_expense** | Obligations + burn (достижения) | achievement_engine *(E1)* |
| **total_monthly_outflow** | Obligations + burn (подсказка «уйдёт за период») | overview *(E1)* |
| **Победа MVP** | Упрощённое описание для игрока/онбординга: подушка, нет просрочки, поток ≥ 0; с 7-го периода. **В prod** победа считается движком **Victory v2** (M из N из `victory_config_json`) — см. [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md), [ADR-002](../decisions/ADR-002-victory-engine-and-template-config.md) | `GET /api/finance/overview` → `win_reached`, блок `victory` |
| **Victory v2** | Победа по `victory_config_json`: в prod **`progression_mode: chain`** (все шаги по порядку) или legacy **`parallel`** (M из N); `min_period_index_for_victory` (обычно 7) | `victory/engine.py`, `overview.victory`, [ADR-002](../decisions/ADR-002-victory-engine-and-template-config.md) |
| **mechanics_unlock** | Выдача флагов `capital_*` после ключей целей цепочки победы | `blueprint_json`, [ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md) |
| **save_kind** | Режим сохранения: `game` \| `plan`; **immutable** после создания | `GameProfile.save_kind`; [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md) |
| **Game** *(цель)* | Игра со стартовым шаблоном, агрегированные расходы, победа M из N | evolution §II |
| **Plan** *(цель)* | Ручное планирование, статьи расходов | evolution §II |
| **MQX** | Визуальный слой premium-вкладок (`mqx-*`) | см. [`SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md) |
| **event_tier** | Сложность сценария; окно выпадения от **периода** (10 периодов = 1 band), не тема | `event_definitions.event_tier`, `game_rules.event_tier_progression_level(period_index)`, [`remove-character-xp-and-levels.md`](../vision/ideas/remove-character-xp-and-levels.md) |
| **event_domain** | **Тематическая область** карточки (еда, авто, семья…) — для пула и аналитики; не путать с глубиной | `metadata_json.event_domain`; см. [`handbook/EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) |
| **scenario_shape** | **Форма сценария**: мягкое предложение, цепочка, привязка к имуществу… | `metadata_json.scenario_shape`; там же |
| **interaction_kind** | **Вид взаимодействия**: выбор, сообщение, продолжение цепочки, вводное | `metadata_json.interaction_kind`; там же |
| **Цепочка событий** | Решение в прошлом месяце → отложенная карточка-продолжение | `enqueue_event`, `event_profile_chains`; [`EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) §3 |
| **mandatory_gate** | **Блокировка закрытия месяца** до выбора (`blocks_period_end`) | `event_definitions.mandatory_gate`; [`EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) §4 |
| **prerequisites_json** | **Условия появления** (есть машина, полис, …) | `event_definitions.prerequisites_json` |
| **Trade-off события** | Нет «бесплатных» needs+: рост потребностей оплачивается cash/burn; отказ часто с needs− | [`handbook/EVENTS.md`](../handbook/EVENTS.md), [`event-choice-balance-tradeoffs.md`](../vision/ideas/event-choice-balance-tradeoffs.md) |
| **Lifecycle события** | Правила повтора: разовый сюжет, редкая оптимизация расходов, бытовое consumption | `repeat_policy`, `cooldown_periods`; [`EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) §2.5; authoring — [`EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md) |
| **needs_axis_map** | Главная ось `needs_delta` по теме карточки (жильё→comfort, семья→social, …) | [`EVENTS.md`](../handbook/EVENTS.md) § потребности; authoring — [`EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md) |
| **repeat_policy** | Повторяемость определения в партии: `repeatable`, `once_per_profile`, `max_per_profile` | `event_definitions.repeat_policy`, [`SPEC_mvp-11-progression-events.md`](../specs/features/SPEC_mvp-11-progression-events.md) |
| **cooldown_periods** | Минимум периодов между повторной **выдачей** того же definition после выбора | `event_definitions.cooldown_periods` |
