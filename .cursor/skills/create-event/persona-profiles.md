# Персоны Game Mode (для /create-event)

Канон шаблонов: [`backend/app/seeds/game_starter_templates.py`](../../../backend/app/seeds/game_starter_templates.py).

**Канон событий v2:** [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../../docs/specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) · [`EVENTS_TERMS_RU.md`](../../../docs/handbook/EVENTS_TERMS_RU.md).

---

## Audience vs prerequisites vs content_class

| Механизм | Назначение |
|----------|------------|
| **`audience_template_keys`** | **Кому показывать** — `["all"]` или `mq_game_basic_v1` / `mq_game_tight_budget_v1`. **Не** «стилистика текста». |
| **`content_class: profile`** | Ролевой **сюжет**; audience **без** `all`. |
| **`content_class: universal`** + audience student/pro | Та же **механика**, разный текст — **две записи**. |
| **`prerequisites_json`** | **Instrumental:** машина, полис, подушка, период — AND условий. |
| **`content_class: needs_risk`** | Риск при оси &lt; 33%; slot `needs_risk` (EVT1). |
| **`content_class: global`** | Macro **на шаблон**; slot `global_macro`; cooldown на **партию**. |

**Prod (до EVT1):** фильтр по `audience_template_keys` в движке **может отсутствовать** — старый обход: `forbid_active_asset_kinds_any` / `active_asset_kinds_any`. **Новый контент** — пиши audience в YAML; не полагайся только на prereq для «только студент».

**Legacy:** `extra.is_rescue` + `rescue_event_bias` — усиление в pool of 2; целевое — **`needs_risk`** отдельный слот (EVT1-060).

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
| `rescue_event_bias` | 1.2 *(legacy до needs_risk slot)* |
| Treat self | пикник с друзьями → social+health |

**Тон копирайта:** учёба, общага/съём, подработка, друзья, бюджет «до зарплаты».

**Приоритет `needs_delta`:** social, health → comfort, status.

**Типичные домены:** consumption, health, social_family, investment_education, income_work.

**Authoring:** `audience_template_keys: [mq_game_basic_v1]` для student-only; global macro — отдельный key `*_student`.

---

## Профессионал — `mq_game_tight_budget_v1`

| Поле | Значение |
|------|----------|
| UI label | Профессионал |
| `monthly_salary` | ~100 000 ₽ |
| Burn база (жизнь) | ~27 500 ₽ (+ аренда, авто, кредит) |
| Активы | `leased_dwelling`, `car_personal` |
| Долг | автокредит |
| Needs initial | comfort 65, status 35, social 52, health 60 |
| `consequence_profile` | standard |
| Treat self | ужин/статус → status+comfort |

**Тон копирайта:** карьера, аренда, машина, кредит, «нет времени».

**Приоритет `needs_delta`:** status, comfort → social, health.

**Типичные домены:** consumption, auto, housing, credit_debt, insurance.

**Instrumental prereq:** `car_personal`, `leased_dwelling`, полисы — при `content_class: instrumental`, audience часто `all`.

---

## Другие шаблоны (кратко)

| template_key | title | События |
|--------------|-------|---------|
| `mq_game_mortgage_stress_v1` | Семья / ипотека | instrumental, housing |
| `mq_game_debt_stack_v1` | Максимум долгов | tier↑, credit_debt |

---

## Баланс (ориентиры)

| Правило | Студент (62.5k) | Профессионал (100k) |
|---------|-----------------|---------------------|
| Мягкий траты «сейчас» | 2–8k; &gt;15k — сильный | 3–12k; &gt;25k — сильный |
| % от зарплаты | обычно ≤10% | обычно ≤12% |
| `monthly_burn_delta_pct` | +0.05 ≈ +1.9k burn | +0.05 ≈ +1.4k |
| `needs_delta` | 1–3 оси | status/comfort чаще выше |

Preview burn: `build_choice_impacts`.

**Trade-off:** см. [`event-balance-rules.md`](event-balance-rules.md) — needs+ не бесплатно; отказ почти всегда с минусом по needs.

**Тема → ось needs:** матрица §11 в [`event-balance-rules.md`](event-balance-rules.md); в brief — `needs_axis_map`.

**Повтор карточки:** §10 + [`event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md).

---

## Парные события (одна механика — два профиля)

**`content_class: universal`** (не profile, если сюжет одинаковый по форме):

```text
mq11_coffee_takeaway_student   audience: [mq_game_basic_v1]
mq11_coffee_takeaway_pro         audience: [mq_game_tight_budget_v1]
```

Одинаково: domain, tier, shape, event_slot `period_choice`. Различие: key, audience, текст, sums, needs_delta.

**`content_class: profile`** — когда сюжет **разный** (одногруппники vs коллеги на курсах), не пара universal.
