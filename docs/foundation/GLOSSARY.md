# Глоссарий ТВОЙ ХОД

Единые термины для foundation, spec и UI. При добавлении поля в API — обновлять здесь и в [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md).

| Термин | Значение | Код / API |
|--------|----------|-----------|
| **Период** | Игровой «месяц» фиксированной длительности | `period_index`, `period_duration_seconds` |
| **Cash** | Операционный счёт игрока | `cash_balance` |
| **Подушка** | Резерв безопасности | `safety_fund_balance` |
| **Обязательства** | Платежи по долгам + обслуживание активов | `total_monthly_obligations` |
| **Просрочка** | Неоплаченный остаток по долгу | `overdue_amount` |
| **Чистый денежный поток** | Доход − обязательства (долги + обслуживание активов); **без** burn жизни | `net_monthly_cashflow` |
| **Расходы (burn)** | Ежемесячные траты на жизнеобеспечение (еда, жильё, …) | `monthly_burn_total`, `profile_expense_lines` *(E1)* |
| **Статья расходов** | Строка бюджета: категория + сумма/мес | `profile_expense_lines` *(E1)* |
| **monthly_reference_expense** | Obligations + burn (достижения) | achievement_engine *(E1)* |
| **total_monthly_outflow** | Obligations + burn (подсказка «уйдёт за период») | overview *(E1)* |
| **Победа MVP** | Подушка ≥ 3× обязательств, нет просрочки, поток ≥ 0; `win_reached` с 7-го периода | `GET /api/finance/overview` |
| **save_kind** *(цель)* | Режим сохранения: `game` \| `plan` | заменит `GameProfile.mode` light/hardcore |
| **Game** *(цель)* | Игра со стартовым шаблоном, агрегированные расходы, победа M из N | evolution §II |
| **Plan** *(цель)* | Ручное планирование, статьи расходов | evolution §II |
| **MQX** | Визуальный слой premium-вкладок (`mqx-*`) | см. [`SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md) |
| **event_tier** | Сложность сценария для отбора по уровню игрока (не тема) | `event_definitions.event_tier`, [`LEVEL_XP_SYSTEM.md`](../specs/gameplay/LEVEL_XP_SYSTEM.md) |
| **event_domain** *(план)* | Тема события: авто, страховка, семья… — для пула и аналитики | idea: [`event-types-and-taxonomy.md`](../vision/ideas/event-types-and-taxonomy.md) |
| **interaction_kind** *(план)* | Форма UX: `choice`, `informational`, `chain_followup`, `intro` | там же |
