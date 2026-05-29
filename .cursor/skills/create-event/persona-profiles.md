# Персоны Game Mode (для /create-event)

Канон шаблонов: [`backend/app/seeds/game_starter_templates.py`](../../../backend/app/seeds/game_starter_templates.py).

**Prod (2026-05):** фильтр `EventDefinition` по `starter_template_key` (**audience_json**) — в [architecture § Фаза 2](../../../docs/architecture/architecture.md), **ещё не в коде**. Пока персонализация:

1. **Отдельные `definition_key`** (`_student` / `_pro` или общий + `prerequisites_json`).
2. **`prerequisites_json`** — событие только если у партии есть авто, аренда, полис и т.д.
3. **`metadata_json.is_rescue` + `rescue_axes`** — bias из blueprint (`rescue_event_bias`).

---

## Студент — `mq_game_basic_v1`

| Поле | Значение |
|------|----------|
| UI label | Студент |
| `monthly_salary` | ~62 500 ₽ |
| `base_monthly_lifestyle` (burn база) | ~37 500 ₽ |
| Старт | без активов/долгов в blueprint |
| Needs initial | comfort 72, status 48, social 58, health 76 |
| `consequence_profile` | soft |
| `rescue_event_bias` | 1.2 |
| Treat self | пикник с друзьями → social+health |

**Тон копирайта:** учёба, общага/съём, подработка, друзья, бюджет «до зарплаты», дешевле/проще.

**Приоритет `needs_delta` на выборах:** social, health → comfort, status.

**Типичные домены:** consumption, health, social_family, investment_education (курсы), income_work.

**Избегать без prereq:** автокредит, ипотека, «содержание двух авто».

---

## Профессионал — `mq_game_tight_budget_v1`

| Поле | Значение |
|------|----------|
| UI label | Профессионал |
| `monthly_salary` | ~100 000 ₽ |
| Burn база (жизнь) | ~27 500 ₽ (+ аренда студии, авто, кредит отдельно) |
| Активы | `leased_dwelling`, `car_personal` |
| Долг | автокредит |
| Needs initial | comfort 65, status 35, social 52, health 60 |
| `consequence_profile` | standard |
| Treat self | ужин/статус → status+comfort |

**Тон копирайта:** карьера, аренда студии, машина, кредит, «нет времени», качество vs цена.

**Приоритет `needs_delta`:** status, comfort → social, health.

**Типичные домены:** consumption, auto, housing, credit_debt, insurance.

**Механика как у студента, другой skin:** тот же `cash_delta` / shape, **новый key**, другие title/description, prereq `car_personal` где уместно.

---

## Другие шаблоны (кратко)

| template_key | title | Когда событие |
|--------------|-------|----------------|
| `mq_game_mortgage_stress_v1` | Семья / ипотека | prereq home, mortgage |
| `mq_game_debt_stack_v1` | Максимум долгов | высокий tier, debt domains |

---

## Баланс (ориентиры)

| Правило | Студент (62.5k) | Профессионал (100k) |
|---------|-----------------|---------------------|
| Мягкий траты «сейчас» | 2–8k типично; &gt;15k — сильный выбор | 3–12k; &gt;25k — сильный |
| % от зарплаты на choice | обычно ≤10% за раз | обычно ≤12% |
| `monthly_burn_delta_pct` | +0.05 ≈ +1.9k burn | +0.05 ≈ +1.4k к burn базе |
| `needs_delta` на кнопке | 1–3 оси, сумма модерата | status/comfort чаще выше |

Всегда сверять **preview burn** (`build_choice_impacts`) — игрок видит «Расходы на жизнь / период».

---

## Парные события (одна механика — два профиля)

```text
mq11_coffee_takeaway_student   — «Кофе с одногруппниками», −800₽, social+health
mq11_coffee_takeaway_pro       — «Кофе перед встречей», −1200₽, status+comfort
```

Одинаково: `event_domain`, tier, shape. Различие: key, текст, sums, needs_delta, prereq (pro: опционально min assets).
