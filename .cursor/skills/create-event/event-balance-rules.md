# Баланс выборов в событиях (авторинг)

**Канон:** [`docs/vision/ideas/event-choice-balance-tradeoffs.md`](../../../docs/vision/ideas/event-choice-balance-tradeoffs.md)

Используй при **`/create-event`** и при ревизии YAML. Salary: студент **62.5k**, про **100k** — [`persona-profiles.md`](persona-profiles.md).

---

## 1. Закон trade-off (главный)

> **Плюс по потребностям не бывает бесплатным.**

Если у выбора **суммарный** `needs_delta` по осям **&gt; 0** (или одна ось **+5 и выше**), должна быть **явная компенсация**:

| Компенсация | Поле |
|-------------|------|
| Деньги сейчас | `cash_delta` **&lt; 0** |
| Деньги потом | `monthly_burn_delta_pct`, `expense_line`, `monthly_lifestyle_delta` |
| Другая ось | тот же choice: например social **+8**, comfort **−4** *(редко, с копирайтом)* |
| Время / риск | только в **needs_risk** / mandatory с narrative в description |

**Запрещено (без `balance_exception` в brief):**

```yaml
# ❌ «бесплатный плюс»
- title: Сходить с друзьями
  effects:
    cash_delta: 0
    needs_delta: { social: 10, comfort: 5 }
```

**Ок:**

```yaml
# ✓ платишь — получаешь
- title: Сходить с друзьями
  effects:
    cash_delta: -2500
    needs_delta: { social: 10, comfort: 4 }

# ✓ отказ — цена в needs (soft_offer)
- title: Остаться дома
  effects:
    cash_delta: 0
    needs_delta: { social: -6, comfort: -2 }
```

---

## 2. Закон отказа (soft_offer)

Для **`scenario_shape: soft_offer`** и **`interaction_kind: choice`**:

- Вариант **«не тратить» / «отказаться» / «потом»** с `cash_delta >= 0` → в **большинстве** случаев **needs не растут**; часто **needs −** на 1–2 осях (упущенное).
- **Нейтральный** 0/0/0 — только tier-1, не более **одного** такого выбора в карточке и с текстом «ничего не меняется».
- **Не** делать отказ **строго лучше** платного (больше needs при меньших тратах) — см. §3.

**Mandatory / asset_linked:** отказ может быть дороже (cash, просрочка narrative); «бесплатный выход» — только при страховке (`insurance_claim` path).

---

## 3. Нет доминирующего выбора

Проверка **Pareto** по **каждой паре** кнопок **в обе стороны** (порядок в `choices:` не важен).

**Вектор сравнения** (по каждой оси **выше = лучше** для игрока):

| Ось | Как считается |
|-----|----------------|
| cash | `cash_delta` |
| needs+ | сумма **положительных** значений по осям `needs_delta` |
| needs− | сумма **отрицательных** значений (ближе к 0 = лучше) |
| burn | явная **экономия** (`monthly_lifestyle_delta` &lt; 0, −`expense_line`) ↑; **рост** burn ↑ штраф; `monthly_burn_delta_pct` &gt; 0 — фикс. штраф без профиля |

**A доминирует B**, если по всем осям A ≥ B и хотя бы одно неравенство строгое → **перебаланс** (поднять цену «хорошего», усилить минус отказа, снизить needs на «дешёвом»).

**Типичная ошибка:** отказ **последним** в YAML с `cash_delta: 0` и `needs+` выше, чем у платной кнопки — линтер ловит это после fix 2026-05-30 (двусторонний Pareto).

**Типичная здоровая тройка (tier-1 consumption):**

| Кнопка | cash | needs | Роль |
|--------|------|-------|------|
| Дешёво | −3…−8% salary | умеренный + | разумный компромисс |
| Дорого | −10…−15% salary | сильный + | «хочу максимум» |
| Отказ | 0 | −2…−8 суммарно | экономия с одиночеством/скукой |

### 3.1. Автомат `balance_contract.py` (EVT1-106)

| Код | Правило |
|-----|---------|
| `free_lunch` | §1 — needs+ без cash−, burn+ и без compensating needs− |
| `pareto_dominates` | §3 — доминирование по 4D-вектору (см. выше) |
| `forbidden_effect` | `xp_delta` запрещён |

**Пропуск Pareto (намеренно):**

| Условие | Почему |
|---------|--------|
| `insurance_claim` в choice | выплата полиса не в YAML |
| `used_car_action` | cash/asset подставляет движок |
| `enqueue_event` у **любого** choice в паре | отложенный исход цепочки; сравниваем trade-off в **первом** звене |

**Где enforced:**

- `pytest tests/unit/events/test_event_balance_contract.py` — baseline **0**
- `validate_mvp11_specs()` → `validate_mvp11_balance()` — gate каталога (`test_mvp11_yaml_catalog`)

**Диагностика:**

```bash
cd backend && python -m pytest tests/unit/events/test_event_balance_contract.py -q
cd backend && python -c "from app.events.balance_contract import validate_mvp11_balance; from app.events.mvp11_catalog import load_mvp11_catalog; v=validate_mvp11_balance(load_mvp11_catalog()[0]); print(len(v)); [print(x) for x in v[:10]]"
```

**Не покрывает автоматом:** §2 отказ (эвристика в `/event-analysis`), §10 lifecycle, §11 axis map, точная величина `monthly_burn_delta_pct` без профиля.

---

## 4. Needs risk (`content_class: needs_risk`)

Событие после просадки оси — **последствие**, не награда.

- **Запрещено:** choice с needs+ и `cash_delta >= 0` без другого штрафа.
- **Ок:** платное смягчение (−cash → needs+), или «принять удар» (needs остаётся низким / −cash без needs+), или burn+/обязательство.
- **Не** путать с legacy `is_rescue` в pool of 2 — целевой class **`needs_risk`**, отдельный слот.

Пример:

```yaml
choices:
  - title: Сходить, хоть и нет денег — в кредит друзьям
    effects:
      cash_delta: -1500
      needs_delta: { social: 8 }
  - title: Закрыться дома
    effects:
      cash_delta: 0
      needs_delta: { social: -5, comfort: -3 }
```

---

## 5. Informational / intro / chain

| Тип | Trade-off |
|-----|-----------|
| `interaction_kind: informational` | одна кнопка «Понятно»; effects пустые или чисто narrative |
| `intro` / `meta` | без экономического trade-off |
| chain follow-up | отсылка к прошлому выбору; trade-off может быть **в первом** звене |

---

## 6. Числовые ориентиры (% от `monthly_salary`)

| Tier | «Платный» choice \|cash\| | needs+ (одна ось) | Отказ needs |
|------|--------------------------|-------------------|-------------|
| 1 soft | 2–8% | +3…+10 | −2…−8 суммарно |
| 2 | 5–15% | +5…+12 | −3…−10 |
| 3+ mandatory | 10–25%+ | по сюжету | редко без cost |

**Правило большого пальца:** каждые **+10 needs** на главной оси ≈ **3–8% salary** или заметный burn (+0.03…+0.08 `monthly_burn_delta_pct`).

Сверяй **`build_choice_impacts`** — игрок видит «Счёт сейчас» и «Расходы на жизнь».

---

## 6.1. Видимость impacts в UI (обязательно)

Trade-off **не работает**, если игрок не видит цену до нажатия.

| Требование | Деталь |
|------------|--------|
| **Показать до выбора** | На каждой кнопке choice — chips/строки из API `impacts` (cash, needs по осям, burn/lifestyle, safety при наличии) |
| **Согласованность** | Цифры в brief/YAML = то, что отдаёт `build_choice_impacts` для типичного профиля шаблона |
| **needs_risk / mandatory** | Тот же стандарт; «бесплатный» плюс без видимого минуса — ошибка и UX, и баланса |
| **Informational** | Одна кнопка; trade-off не требуется (§5) |

**При авторинге:** в черновике карточки для пользователя перечисли impacts **по каждой кнопке**. Если в prod UI chips ещё неполные — завести задачу FE; **не** ослаблять YAML «пока не видно».

**Проверка:** ручной прогон или `#/dev/mqx` / карусель событий — все economic effects видны до tap.

**Запрещено в effects:** `xp_delta` — снято ([ADR-003](../../../docs/decisions/ADR-003-remove-character-progression.md)); не добавлять в YAML.

---

## 7. Исключения (`balance_exception` в brief)

Допустимы только с **явной пометкой** в `docs/vision/ideas/event-briefs/<key>.md`:

- страховая выплата / insured path (cash neutral);
- разовый narrative_once без повторения;
- обучающее событие meta (tier 0).

---

## 8. Чеклист перед merge (каждое событие)

- [ ] Нет choice с needs+ и `cash_delta >= 0` и без burn/needs− на другой оси
- [ ] soft_offer: отказ не «лучше» платного по Pareto
- [ ] Нет пары кнопок, где A доминирует B
- [ ] needs_risk: нет бесплатного восстановления
- [ ] Суммы в % salary в пределах tier
- [ ] **Lifecycle (§10):** класс A/B/C выбран; `cooldown_periods` / `repeat_max` не «бесконечная оптимизация»
- [ ] **Оси needs (§11):** главная ось совпадает с темой; нет health+ на жилье без исключения
- [ ] `balance_notes` / brief заполнен; исключения названы
- [ ] pytest + тест «жму только плюсы»; impacts перечислены в черновике (§6.1)
- [ ] нет `xp_delta` в effects

---

## 10. Жизненный цикл: повтор, cooldown, «лестница»

> **Продукт:** одна и та же карточка не должна давать бесконечно удешевлять жизнь (тариф, переезд в меньше). См. [`event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md).

**Не путать:** `weight` в YAML — **частота в пуле**; §10 — **можно ли снова показать ту же историю** и **правдоподобен ли повтор выбора**.

### 10.1. Классы события (выбери один в brief)

| Класс | Когда | `repeat_policy` | `cooldown_periods` | `repeat_max` |
|-------|--------|-----------------|-------------------|--------------|
| **A. Разовый сюжет** | релокация с бонусом, сюжетный twist, «один раз за партию» | `once_per_profile` | — | — |
| **B. Оптимизация с потолком** | удешевить тариф, съехать в меньше, отменить подписку | `max_per_profile` | **≥ 12** | **1–2** |
| **C. Реверсибельная лестница** | снова «меньше» только после «больше» | `repeatable` + prereq **state** *(EVT1)* | **≥ 12** после выбора | по state |
| **D. Вариант текста** | та же механика, новая карточка | **новый `definition_key`** | **≥ 3** на каждый key | — |

**Правило:** если при повторе игрок думает *«я уже живу в коробке / на минимальном тарифе»* → **не** оставляй голый `repeatable` без cooldown и без B/C.

**Примеры prod (перебаланс EVT1-105):**

| key | Проблема | Целевой класс |
|-----|----------|---------------|
| `mq11_downsize_flat` | `repeatable`, нет cooldown | **B** + cooldown 12+ |
| `mq11_home_internet` | downgrade можно крутить часто | **B** на ветку «дешевле» или cooldown 12+ на def |
| `mq11_relocation_bonus` | сюжет релокации | **A** `once_per_profile` |

### 10.2. Деньги и расходы при повторе

| Правило | Деталь |
|---------|--------|
| **E1** | Повторяемое **удешевление** жилья/связи → в effects **comfort −** (часто status −), не health |
| **E2** | Не копить противоречия: −`monthly_lifestyle_delta` и +`expense_line` housing в одном «сжатии» без сюжета (субаренда — отдельная ветка с текстом) |
| **E3** | В brief: «после N раз lifestyle уже у пола» — до EVT1: `repeat_max`; после EVT1: prereq `housing_tier != minimal` |
| **E4** | `expense_line.amount_monthly` — **дельта** к строке; автор не закладывает отрицательную «аренду» — пол **0** на категорию *(движок E1)* |

**Prod сейчас:** `clamp_profile_lifestyle_delta` ограничивает суммарный lifestyle-delta; **не** заменяет §10 — событие всё равно может выпадать снова.

### 10.3. State ladder (целевой движок EVT1)

В brief фиксируй **состояние партии**, если нужен класс **C**:

```yaml
# brief (authoring)
lifecycle_class: C
state_ladder:
  flag: housing_tier          # minimal | standard | premium
  choice_sets_flag:
    - choice: Переехать в квартиру меньше
      sets: minimal
    - choice: Переехать в больше
      sets: premium
  prereq_for_event:
    mq11_downsize_flat: [standard, premium]   # не minimal
```

Пока флагов нет — используй **B** (`max_per_profile`, `repeat_max: 1`, `cooldown_periods: 12`).

### 10.4. Анти-усталость (пул)

См. [`event-engagement-anti-fatigue.md`](../../../docs/vision/ideas/event-engagement-anti-fatigue.md): отдельные keys, ротация `event_domain`, fatigue weight после выборов. **Дополняет** §10, не заменяет.

---

## 11. Согласованность темы и осей `needs_delta`

> **Продукт:** семья → social; жильё → comfort; отдых один → health; отдых с людьми → health + social.

### 11.1. Матрица (главная / вторичная / не трогать)

**Главная ось** — большая часть «смысла» числа; **вторичная** — обычно ≤ 40% главной по модулю; **запрещённая** — 0 без `balance_exception`.

| Тема / `event_domain` | Главная | Вторичная (редко) | Обычно не трогать |
|------------------------|---------|-------------------|-------------------|
| `housing`, быт, тариф, переезд | **comfort** | status | health |
| Имущество, техника, мебель, авто *(не спорт)* | **comfort** | status | health |
| Спорт, велосипед, зал, врач *(профилактика)* | **health** | comfort | status |
| `social_family`, друзья, коллеги, свидание | **social** | comfort или health *(мало)* | status *(если не статусный сюжет)* |
| Отдых **один** | **health** | comfort | social |
| Отдых **с людьми** | **health** + **social** | comfort *(мало)* | — |
| Карьера, повышение, статусный ужин | **status** | comfort | health |
| Страховка / ремонт жилья | **comfort** | health *(мелко)* | social |
| `consumption` *(кофе, доставка)* | по копирайту: чаще **comfort** или **social** | вторая из пары | health |

### 11.2. Проверка автора

В brief добавь строку:

```yaml
needs_axis_map: housing → comfort primary; status secondary
```

| Сигнал | Действие |
|--------|----------|
| `health` **+6** на жилье/тарифе без «здоровье» в title/description | **пересмотреть** или `balance_exception` |
| Три оси **+** на одной кнопке tier-1 | сузить; оставить главную + одну вторичную |
| `social` **+** на чисто бытовом тарифе без людей | добавить копирайт или убрать social |

### 11.3. Связь с trade-off (§1)

Оси — **какая** цена в needs; §1 — **платная** ли эта цена (cash/burn). Оба обязательны.

---

## 12. Подсказка MCE (авторинг, не автозапись YAML)

**MCE** (monthly cost equivalent) — перевод effects в «долю зарплаты» для проверки §1 и §6.

```text
cost     = (-cash_delta / S) + (Δburn_monthly / S) + (|monthly_lifestyle_delta| / S если < 0)
benefit  = Σ w_axis · max(0, needs_delta[axis]) / 100
penalty  = Σ w_axis · max(0, -needs_delta[axis]) / 100   # отказ

L1: если benefit > ε  →  cost + penalty ≥ k_tier · benefit
```

| Tier | k_tier *(старт)* |
|------|------------------|
| 1 soft | 0.35–0.50 |
| 2 | 0.45–0.60 |

**Веса осей `w_axis`:** см. [`persona-profiles.md`](persona-profiles.md) (студент: social/health выше; про: status/comfort).

**Использование:** подобрать `|cash_delta|` под целевой `needs+` (**не** генерировать весь YAML из формулы). Ориентир §6 «правило большого пальца»; калибровка — playtest / EVT1-105.

---

## 13. Аудит каталога (`/event-analysis`)

Искать кандидатов на перебаланс:

```bash
rg "cash_delta: 0" data/events/mvp11/ -A6 | rg "needs_delta" 
```

Флаг **CONCERNS**, если у tier-1 soft_offer &gt;30% choices с needs+ при cash ≥ 0.

**Автомат:** `backend/app/events/balance_contract.py` — §1/§3 (см. §3.1); gate в `mvp11_contract.validate_mvp11_specs`. Baseline pytest **0**. §10/§11 — ручной audit ниже.

**Ручной скан повторов:**

```bash
rg "repeat_policy: repeatable" data/events/mvp11/ -B5 | rg "cooldown_periods|definition_key"
rg "monthly_lifestyle_delta: -" data/events/mvp11/ -B8
```

**CONCERNS:** housing/consumption defs с `repeatable`, **без** `cooldown_periods`, и choice с сильным −lifestyle / downgrade.
