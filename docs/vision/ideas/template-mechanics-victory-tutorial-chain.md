---
layer: idea
status: draft
owner: product
last_reviewed: 2026-05-24
related_specs:
  - ../../foundation/SPEC_PRODUCT.md
  - starter-template-mechanics-permissions.md
  - game-balance-thresholds-and-constraints.md
  - money-quest-evolution-after-mvp.md
idea_refine: true
next_spec: specs/features/SPEC_template-victory-tutorial-chain.md
---

# Шаблон как узкий учебник: цели ↔ механики ↔ «прикосновение»

Сессия **idea-refine** (май 2026). Выбор продукта: **узкий учебник**, **быстрое прохождение**, при этом игрок **хотя бы раз использует каждую открытую механику**. Список целей и пороги — **редактируемые в данных шаблона**, не зашиты в код.

Опора: уже есть `blueprint.mechanics`, `victory_config_json` с `progression_mode: chain`, движок в `victory_engine.py`, UI целей на дашборде.

---

## Problem Statement

**Как сделать так, чтобы стартовый шаблон Game Mode вёл игрока по короткой, понятной дуге — открывая по одной механике и проверяя, что он ею воспользовался, — а не показывал сразу весь «капитал» или цели, к которым нет инструментов?**

---

## Recommended Direction

Собрать три идеи в одну модель **«учебная цепочка»**:

| # | Идея | Роль в продукте |
|---|------|-----------------|
| **1** | Связка **цель ↔ механика** | Цель не активна и не засчитывается, если в шаблоне выключен нужный раздел (`requires_mechanics`). Нет цели «квартира» при `capital_property: false`. |
| **2** | **Разблокировка механик по цепочке целей** | После выполнения текущей цели chain следующий флаг в `blueprint.mechanics_effective` (или снимок в профиле) включает следующий раздел капитала + API-мутации. Замена снятой прогрессии XP/уровня. |
| **5** | **Цели-обучалки (`action_once`)** | Короткие шаги: «забрал зарплату», «перевёл в подушку», «открыл депозит» — дают быстрый прогресс и **обязательное прикосновение** к механике до финансовых порогов. |

**Принцип шаблона `mq_game_basic_v1`:** узкий учебник — на старте только дашборд (период, зарплата, подушка) + доходы/расходы; **инвестиции** в blueprint включены, но в UI/API **эффективно открываются** после 1–2 tutorial-целей; страховки/имущество/долги в basic **не входят** (как сейчас в preset).

**Победа:** `progression_mode: chain` + редактируемый список целей в `victory_config_json`; `required_goals_met` и пороги — данные (плейтест: укоротить список или снизить пороги для «быстрого» прохождения). Финальная цель basic — про **инвестиционный** доход (депозит/облигации), не абстрактный «пассив» при отсутствии недвижимости.

**UX:** одна «текущая цель» (`current_goal_key` уже есть в overview) + подсказка «следующий шаг» → раздел капитала или кнопка на дашборде; Монетка может дублировать текст цели.

---

## Целевая схема данных (черновик)

### `blueprint` (расширение)

```json
{
  "mechanics": {
    "capital_invest": true,
    "capital_insurance": false,
    "capital_property": false,
    "capital_liabilities": false
  },
  "mechanics_unlock": [
    { "after_goal": null, "grant": ["dashboard_core"] },
    { "after_goal": "tutorial_salary", "grant": ["capital_flows"] },
    { "after_goal": "tutorial_cushion", "grant": ["capital_invest"] }
  ]
}
```

- `dashboard_core` — зарплата, подушка, таймер (всегда).
- `capital_flows` — блок доходы/расходы (информация, без мутаций).
- Остальные ключи — как сегодня `capital_*`.

### `victory_config.goals[]` (расширение)

```json
{
  "key": "tutorial_deposit",
  "type": "action_once",
  "title": "Открыть депозит",
  "action": "invest_deposit_opened",
  "requires_mechanics": ["capital_invest"],
  "enabled": true
}
```

```json
{
  "key": "safety_3x",
  "type": "safety_fund_months",
  "requires_mechanics": ["dashboard_core"],
  "months_multiplier": 3
}
```

- Поле **`requires_mechanics`** — фильтр видимости и засчитывания (идея **1**).
- Тип **`action_once`** — идея **5**; список `action` — маленький enum на бекенде (события из периодных API).

### Overview (контракт для UI)

- `mechanics` — как сейчас (шаблон).
- `mechanics_effective` — что реально доступно после chain (**2**).
- `victory.current_goal_key`, `victory.goals[]` с `met`, `available`, `blocked_reason`.

---

## Пример дуги для basic (редактируемый список)

Порядок для плейтеста «быстро + прикосновение» (цифры — в JSON, не в коде):

| Шаг | Тип | Смысл | Прикосновение |
|-----|-----|--------|----------------|
| 1 | `action_once` | Забрать зарплату | Кнопка «Зарплата» |
| 2 | `action_once` | Внести в подушку (любая сумма) | «В подушку» |
| 3 | `net_monthly_cashflow_nonneg` | Поток ≥ 0 | Чтение дашборда / финансов |
| 4 | `safety_fund_months` ×3 | Подушка к цели | Подушка + финансы |
| 5 | `action_once` | Открыть депозит или купить облигации | Раздел инвестиций |
| 6 | `passive_income_monthly_min` (порог ↓) | Доход с позиций | Удержание депозита/купонов |

Победа: все шаги chain выполнены (или **M из N**, если позже ослабим — `required_goals_met` в JSON). `min_period_index_for_victory` оставить **7** или снизить до **5** только после смоука «быстрого» прохода.

Для **тяжёлых** шаблонов — тот же каркас, но `mechanics_unlock` добавляет insurance → property → liabilities после финансовых tutorial-целей.

---

## Key Assumptions to Validate

- [ ] Игрок **видит** текущую цель и понимает, какую **одну** кнопку нажать — иначе chain воспринимается как блокировка (качественный тест, 5 сессий).
- [ ] **3–5 tutorial-целей + 2–3 пороговые** укладываются в **одну TMA-сессию** (15–25 мин) при текущем `period_duration` basic.
- [ ] `action_once` не дублирует онбординг Монетки — либо слить тексты, либо онбординг заканчивается до появления цели «зарплата».
- [ ] Порог пассивного/инвестдохода достижим **только депозитом/облигациями** на basic без имущества.

---

## MVP Scope

**Включить:**

1. **Схема целей:** `requires_mechanics` + тип `action_once` (минимум: `salary_claimed`, `safety_contributed`, `invest_deposit_opened`, `invest_bond_bought`).
2. **Движок:** при `chain` — цель `available` только если mechanics_effective ⊇ requires; `mechanics_effective` обновляется при `goals_met` по `mechanics_unlock` из blueprint.
3. **API 403** — как сейчас, но по **effective**, не только по шаблону.
4. **UI:** дашборд — одна активная цель + CTA; финансы — аккордеоны по `mechanics_effective`; цели с `available: false` — серые с подписью «откроется после …».
5. **Данные:** пересобрать `victory_config_json` для `mq_game_basic_v1` (редактируемый список); миграция SQL или seed.
6. **Тесты:** basic — нельзя купить страховку; после goal N открывается invest; tutorial goal срабатывает один раз.

**Не включать в MVP этого слоя:**

- Параллельные треки целей (идея 4).
- Три пресета сложности на один `template_key` (идея 7).
- Plan-режим победы (идея 8).
- Жёсткий блок «следующий период» до mandatory-событий.

---

## Not Doing (and Why)

- **Все механики с первого периода** — против «узкого учебника».
- **Возврат XP/уровней** как гейт — заменено целями + unlock.
- **Фиксированный список целей в коде** — только presets/сиды; продукт правит JSON в шаблонах.
- **Цели без связи с механиками** — убираем противоречия вроде пассивного дохода без инвестиций.

---

## Open Questions

- Снижать ли **`min_period_index_for_victory`** для basic с 7 до 5 при «быстром» плейтесте?
- **Одна** финальная цель победы (последняя в chain) vs **M из N** среди всех — пока lean к «вся chain», список редактируемый.
- Где хранить факты `action_once` — флаги на профиле vs производить из истории транзакций/позиций (проще флаги: `profile.tutorial_flags_json`).

---

## Связь с кодом сегодня

| Уже есть | Нужно добавить |
|----------|----------------|
| `blueprint.mechanics`, preset basic | `mechanics_unlock[]`, `mechanics_effective` |
| `victory_engine` chain, `current_goal_key` | `requires_mechanics`, `action_once`, unlock после goal |
| `FinancePremium` по `mechanics` | по `mechanics_effective` + подсказка цели |
| 403 `mechanic_disabled` | проверка effective |

---

## Следующий шаг

После подтверждения — feature spec `SPEC_template-victory-tutorial-chain.md` и задачи: backend (движок + флаги действий) → overview contract → UI дашборд/цели → сид basic goals.
