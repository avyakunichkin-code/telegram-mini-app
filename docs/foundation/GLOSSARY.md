# Глоссарий Money Quest

Единые термины для foundation, spec и UI. При добавлении поля в API — обновлять здесь и в [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md).

| Термин | Значение | Код / API |
|--------|----------|-----------|
| **Период** | Игровой «месяц» фиксированной длительности | `period_index`, `period_duration_seconds` |
| **Cash** | Операционный счёт игрока | `cash_balance` |
| **Подушка** | Резерв безопасности | `safety_fund_balance` |
| **Обязательства** | Платежи по долгам + обслуживание активов | `total_monthly_obligations` |
| **Просрочка** | Неоплаченный остаток по долгу | `overdue_amount` |
| **Чистый денежный поток** | Доход − обязательные выплаты (MVP) | `net_monthly_cashflow` |
| **Победа MVP** | Подушка ≥ 3× обязательств, нет просрочки, поток ≥ 0; `win_reached` с 7-го периода | `GET /api/finance/overview` |
| **save_kind** *(цель)* | Режим сохранения: `game` \| `plan` | заменит `GameProfile.mode` light/hardcore |
| **Game** *(цель)* | Игра со стартовым шаблоном, агрегированные расходы, победа M из N | evolution §II |
| **Plan** *(цель)* | Ручное планирование, статьи расходов | evolution §II |
| **MQX** | Визуальный слой premium-вкладок (`mqx-*`) | см. [`SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md) |
