# Event Brief — одно событие (шаблон)

Скопируйте блок в `docs/vision/ideas/event-briefs/<definition_key>.md` или в описание задачи перед `/create-event`.

**Канон баланса:** [`.cursor/skills/create-event/event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) — §1–4 trade-off, **§10 lifecycle**, **§11 оси needs**, §12 MCE.

**Lifecycle (idea):** [`event-repeat-and-state-ladder.md`](../vision/ideas/event-repeat-and-state-ladder.md)

---

## 1. Выберите `lifecycle_class` → поля в YAML

| Класс | Когда | `repeat_policy` | `cooldown_periods` | `repeat_max` |
|-------|--------|-----------------|-------------------|--------------|
| **A** | Разовый сюжет (релокация с бонусом, twist) | `once_per_profile` | — | — |
| **B** | Удешевление жилья/тарифа, «оптимизация с потолком» | `max_per_profile` | **≥ 12** | **1–2** |
| **C** | Снова «меньше» только после «больше» (state ladder, EVT1) | `repeatable` + prereq state | **≥ 12** | по state |
| **D** | Бытовое tier-1, новый key / anti-fatigue | `repeatable` | **≥ 3** | — |

`lifecycle_class` — **только в brief** (пока нет колонки в БД). В `data/events/mvp11/*.yaml` переноси **`repeat_policy`**, **`cooldown_periods`**, **`repeat_max`** по таблице.

**Не путать:** `weight` — частота в **пуле**; cooldown — пауза между **повторами того же key** после выбора.

---

## 2. Шаблон brief (общий)

```yaml
definition_key: mq11_<domain>_<slug>     # уникальный; вариант B/D = новый key
content_class: universal | profile | instrumental | needs_risk | global
event_slot: period_choice | informational | needs_risk | global_macro
audience_template_keys: [all]            # profile → без all
persona: student | professional | both   # persona-profiles.md
title: ""
description: ""
event_domain: consumption                # taxonomy
scenario_shape: soft_offer | mandatory | chain
interaction_kind: choice
event_tier: 1
mode: game

# --- §10 lifecycle (см. таблицу §1) ---
lifecycle_class: D                       # A | B | C | D
repeat_policy: repeatable                # из таблицы §1
cooldown_periods: 3                      # B/C housing: ≥ 12; D consumption: ≥ 3
repeat_max: null                         # B: 1–2 при max_per_profile

prerequisites:
  active_asset_kinds_any: []
  requires_insurance_any: []

choices:
  - title: ""
    effects:
      cash_delta: 0
      needs_delta: { comfort: 0, status: 0, social: 0, health: 0 }
      # monthly_burn_delta_pct: 0.05     # компенсация needs+ если cash мало

# --- §11 оси needs ---
needs_axis_map: consumption → comfort primary   # матрица §11 event-balance-rules

balance_notes: |
  §1–3: trade-off, Pareto, отказ с needs−
  §10: можно ли снова удешевить? (класс + cooldown)
  §11: главная ось совпадает с темой
  impacts по каждой кнопке (§6.1)
balance_exception: null                  # insured, meta, …

variant_of: null
approved_in_chat: false
```

---

## 3. Примеры YAML-полей (копировать в catalog)

### D — бытовое consumption (кофе, доставка)

```yaml
repeat_policy: repeatable
cooldown_periods: 3
# repeat_max: не нужен
```

### B — переезд в меньше / дешевле тариф

```yaml
repeat_policy: max_per_profile
repeat_max: 1
cooldown_periods: 12
```

### A — сюжетная релокация (один раз за партию)

```yaml
repeat_policy: once_per_profile
# cooldown_periods: не обязателен
```

---

## 4. Чеклист перед merge

- [ ] Отдельный `definition_key` (не `variants[]` в одной записи)
- [ ] `content_class`, `event_slot`, `audience` согласованы (`profile` ≠ `all`)
- [ ] **§10:** `lifecycle_class` в brief → `repeat_policy` / `cooldown` / `repeat_max` в YAML по таблице §1
- [ ] **§11:** `needs_axis_map` заполнен; `needs_delta` по теме (жильё → comfort, семья → social, …)
- [ ] **§1–3:** trade-off, Pareto, отказ; нет `xp_delta`
- [ ] Запись в `data/events/mvp11/<domain>.yaml` (`events:`)
- [ ] `pytest -q` зелёный (`test_event*`, `test_mvp11_yaml_catalog`, `test_event_balance_contract`)
- [ ] Каталог: `/event-analysis` scope **all** — блоки trade-off + lifecycle + axis (перед массовым merge)
