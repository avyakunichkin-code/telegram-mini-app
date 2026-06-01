---
layer: spec
status: draft
owner: product
last_reviewed: 2026-05-26
tracks: character-needs, game-plan, retention
idea: vision/ideas/game-character-needs-foundation.md
architecture: architecture/architecture.md
related: specs/features/SPEC_victory-v2.md, specs/features/SPEC_mvp-11-progression-events.md
adr: decisions/ADR-005-character-needs-state-and-defeat.md, decisions/ADR-006-treat-self-options-and-cooldown.md
supersedes_ui_term: game_starter_templates → «Выбор персонажа» (копирайт)
---

# Spec: Потребности персонажа (фаза 1)

## Глубина проработки (что фиксируем сейчас vs при декомпозиции)

| Слой | Сейчас (spec + ADR) | При декомпозиции / playtest |
|------|---------------------|---------------------------|
| **Механики и контракты** | Decay, поражение, treat-self с выбором, API, колонки БД | — |
| **Формулы** | `periods_to_empty_target`, streak при нуле, кулдаун 15 | Подбор `periods_to_empty_target` (10–15), силы штрафов |
| **Контент** | Структура `treat_self.options[]`, **≥1 опция** в сидах MVP | Довести до 3–4 опций × персонаж; rescue-события |
| **Помощь игроку** | Два раздела справочника (поддержание / критика) | Точные формулировки, иллюстрации, онбординг-шаги |
| **UI** | Паттерны зафиксированы в [`docs/ux/CHARACTER_NEEDS_UX.md`](../../ux/CHARACTER_NEEDS_UX.md) + per-screen specs | Design-lab, пиксели, анимации |

**Вывод:** не нужно «всё до последнего числа» до старта кода; нужно **непротиворечивое ядро** (ниже) + ADR. Числа помечены **playtest** где уместно.

---

## Assumptions

1. **Персонаж MVP** = `starter_template_key` + `blueprint_json.needs`.
2. **Victory v2** не меняется ([ADR-002](../../decisions/ADR-002-victory-engine-and-template-config.md)).
3. **Character XP/level** не возвращаются ([ADR-003](../../decisions/ADR-003-remove-character-progression.md)).
4. **Plan Mode:** `needs.enabled: false`.
5. **Поражение по потребностям** — у **всех** персонажей Game с включёнными needs ([ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md)).
6. **Период** = «месяц» в UI; «3 дня подряд» в обсуждении = **3 периода подряд**.
7. Decay **медленный**: ориентир **10–15 периодов** до нуля без пополнения ([ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md)).
8. **«Порадовать себя»:** кулдаун **15 периодов**, выбор из **`options[]`** — в MVP **минимум 1** вариант на персонажа ([ADR-006](../../decisions/ADR-006-treat-self-options-and-cooldown.md)).
9. Сервер — единственный источник правды; шкалы **0–100**, округление **1 знак** в API.

---

## Objective

**Why:** вовлечь в события и удержать после первой победы; trade-off «жизнь vs деньги».

**Success criteria (фаза 1)**

- [ ] Decay ~12 периодов до нуля (playtest 10–15) без пополнения.
- [ ] Treat-self: ≥1 опция в blueprint, UI выбора (sheet; при одной опции — один тап/подтверждение), кулдаун 15.
- [ ] Поражение: любая шкала **0** три периода подряд — **все** персонажи.
- [ ] Разница soft/hard: последствия при **<30%** и уровень проактивной помощи.
- [ ] Справочник помощи (поддержание + критика) доступен по запросу из UI.
- [ ] Overview, period status, events `needs_delta`, UI дашборда.

---

## Термины

| Термин | Значение |
|--------|----------|
| **Период** | Игровой «месяц» (`period_index`). |
| **Decay** | Списание пунктов в конце периода. |
| **Истощение (distressed)** | Любая шкала **< 30** после decay → штрафы по профилю. |
| **Нулевая просадка** | Любая шкала **== 0** → учёт streak поражения. |
| **Порадовать себя** | Платное действие: выбор сценария → `needs_delta`. |

### UI-лейблы

| Ключ | RU |
|------|-----|
| `comfort` | Комфорт |
| `status` | Статус |
| `social` | Связи |
| `health` | Здоровье |

### Зоны UI (после decay)

| Зона | Условие | Цвет / смысл |
|------|---------|--------------|
| Норма | все ≥ 40 | спокойный |
| Низко | любая < 40 | внимание |
| Истощение | любая < 30 | stressed |
| Ноль | любая == 0 | критично / риск поражения |

---

## Модель данных

### `game_profiles`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `need_comfort` | FLOAT | 0–100 |
| `need_status` | FLOAT | 0–100 |
| `need_social` | FLOAT | 0–100 |
| `need_health` | FLOAT | 0–100 |
| `needs_zero_periods_streak` | INTEGER | Подряд периодов, когда **хотя бы одна** шкала == 0 |
| `treat_self_last_period_index` | INTEGER | 0 = ещё не использовали |

### `blueprint_json.needs` (schema 1)

```json
{
  "needs": {
    "enabled": true,
    "character_label": "Студент",
    "initial": { "comfort": 72, "status": 48, "social": 58, "health": 76 },
    "periods_to_empty_target": 12,
    "decay_per_period": null,
    "thresholds": { "low": 40, "distressed": 30 },
    "consequence_profile": "soft",
    "consequences": {
      "distressed_cash_penalty_pct_salary": 0.02,
      "distressed_cash_penalty_min": 1000
    },
    "player_support": {
      "proactive_hints": true,
      "rescue_event_bias": 1.2
    },
    "treat_self": {
      "cooldown_periods": 15,
      "default_cost_pct_salary": 0.08,
      "cost_min": 2000,
      "cost_max": 25000,
      "options": [
        {
          "id": "picnic_friends",
          "title": "Отгул: пикник с друзьями",
          "subtitle": "Отдых и общение",
          "needs_delta": { "social": 22, "health": 18, "comfort": 6, "status": 4 }
        }
      ]
    }
  }
}
```

| Поле | Описание |
|------|----------|
| `periods_to_empty_target` | Делитель для авто-decay: `initial[key] / target` (**playtest 10–15**, дефолт **12**) |
| `decay_per_period` | Если объект — override авто-расчёта по осям |
| `thresholds.distressed` | **30** — порог «лёгких/тяжёлых» последствий |
| `consequence_profile` | `soft` \| `standard` \| `hard` — сила последствий и подсказок |
| `player_support.proactive_hints` | Студент: true; Предприниматель: false |
| `treat_self.options` | Массив сценариев; **MVP: ≥1** на персонажа; цель контента: **3–4** |

---

## Персонажи (черновик баланса)

| template | label | profile | `periods_to_empty_target` | Поддержка |
|----------|-------|---------|---------------------------|-----------|
| `mq_game_basic_v1` | Студент | **soft** | 14 | подсказки, мягкие штрафы <30%, больше rescue-событий |
| `mq_game_tight_budget_v1` | Специалист | **standard** | 12 | баланс |
| `mq_game_mortgage_stress_v1` | Семья | **standard** | 12 | акцент needs_delta на «Связи» в контенте |
| `mq_game_debt_stack_v1` | Предприниматель | **hard** | 10 | сильные штрафы <30%, без проактивных hint в UI событий |

**Поражение:** одинаково для всех — `needs_zero_periods_streak >= 3`.

**Штрафы при distressed (<30%)** — playtest:

| profile | `distressed_cash_penalty_pct_salary` | min |
|---------|--------------------------------------|-----|
| soft | 0.02 | 1 000 |
| standard | 0.04 | 2 000 |
| hard | 0.06 | 3 000 |

---

## Правила `needs_engine`

### Clamp

`clamp_need(x) = max(0, min(100, round(x, 1)))`

### Decay (конец периода N, до N+1)

```text
for key in axes:
  decay[key] = decay_per_period[key] if set
    else round(initial[key] / periods_to_empty_target, 1)
  need[key] = clamp_need(need[key] - decay[key])
```

**Пример:** `initial.comfort = 72`, `target = 12` → decay **6**/период → ~12 периодов до 0.

### Поражение ([ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md))

```text
has_zero = any(need[key] == 0)
if has_zero:
  needs_zero_periods_streak += 1
else:
  needs_zero_periods_streak = 0

if needs_zero_periods_streak >= 3:
  is_active = 0
  defeat_reason = "needs_depletion"
  GAME_OVER «Поражение: потребности на нуле 3 месяца подряд»
```

### Последствия при distressed (<30%, но не поражение)

После decay, если **не** `has_zero` (или параллельно — штраф только если любая <30):

```text
is_distressed = any(need[key] < thresholds.distressed)
if is_distressed:
  apply cash penalty per consequence_profile (один раз за период)
```

Профиль **soft:** минимальный cash penalty; UI-подсказка «проверь потребности»; приоритет rescue-событий в пуле (контент, фаза 1 — 1–2 жёстко заведённых события).

Профиль **hard:** максимальный penalty; без проактивных toast; справочник только **по кнопке «Помощь»**.

### «Порадовать себя» ([ADR-006](../../decisions/ADR-006-treat-self-options-and-cooldown.md))

**Кулдаун:**

```text
available = enabled AND period open AND (
  treat_self_last_period_index == 0
  OR period_index >= treat_self_last_period_index + cooldown_periods
)
# cooldown_periods default 15
```

**Flow:**

1. Игрок нажимает «Порадовать себя» → если `options.length === 1`, можно сразу confirm или sheet с одной карточкой; иначе sheet со списком.
2. `POST /api/game/period/treat-self` `{ "option_id": "..." }` (обязателен даже при одной опции).
3. `cost = clamp(salary * (option.cost_pct_salary ?? default), min, max)`.
4. `adjust_balance(-cost)`; `apply needs_delta` из опции; `treat_self_last_period_index = period_index`.

**Запрещено:** повторный POST до конца кулдауна; `option_id` не из списка → 400.

---

## События: влияние на потребности (`needs_delta`)

> UX отображения чипов на кнопках выбора: [`docs/ux/screens/character-needs-events.md`](../../ux/screens/character-needs-events.md)

### Цель
Сделать “жизнь” управляемой через **выборы в событиях**: игрок видит `needs_delta` **до** нажатия и получает изменение шкал **после** успешного выбора.

### Контракт данных (контент / БД)
В `EventChoice.effects_json` добавляется ключ `needs_delta`:

```json
{
  "cash_delta": -3000,
  "needs_delta": { "comfort": 0, "status": -4, "social": 10, "health": 6 }
}
```

Правила:
- ключи только из осей: `comfort | status | social | health`
- значения — числа (могут быть отрицательными/положительными)
- итоговые шкалы clamp в диапазон 0–100 с округлением до 1 знака (как в `needs_engine`)
- показывать в UI только ненулевые оси (см. UX spec)

### Серверное применение (choose)
При `POST /api/game/events/{event_id}/choose`:
- если в `effects_json` есть `needs_delta` — применить его к текущим needs профиля:
  - `after = before + needs_delta` по осям
  - `set_profile_needs(profile, after)` (clamp/round — как в `needs_engine`)
- затем вернуть обновлённый overview, чтобы UI синхронизировался по “единому источнику правды”.

### Валидация
- если `needs_delta` не объект → 400
- если в объекте есть неизвестные ключи → 400
- если все значения 0 → допускается (в UI чипы не показываем)

### Статус реализации
- `needs_delta` для **treat-self** (ADR-006): `POST /api/game/period/treat-self`, `period_actions.py`
- `needs_delta` для **событий** (CN1-012): ключ в `ALLOWED_EFFECT_KEYS`, применение в `POST /api/game/events/{id}/choose`, превью в `GET /api/game/events/pending` (`choice.needs_delta`), чипы в `EventChoiceButton`
- Контент playtest: `mq11_gym_membership`, `mq11_family_money_request` (сиды + миграция `0040_event_needs_delta_content.sql`)

---

## Справочник помощи (player support)

**Не** подменяет события; статический контент + доступ с дашборда (иконка **книга+?** в Z-NEEDS v7-e2).

### API

`GET /api/game/needs/guide`:

```python
class NeedsGuideSection(BaseModel):
    heading: str
    items: list[str]

class NeedsGuideResponse(BaseModel):
    title: str = "Потребности"
    sections: list[NeedsGuideSection]
```

### Содержание (prod, `guide_content.py`)

| Раздел | Тема |
|--------|------|
| **Что это** | 4 шкалы, отдельно от cash |
| **Почему снижаются** | decay, события, пороги 30% / ноль / поражение |
| **Как пополнить** | события, `needs_delta`, проверка перед закрытием месяца |
| **Кнопка «Улучшить»** | treat-self, кулдаун ~15 периодов, не замена событиям |

UX: [`character-needs-help.md`](../../ux/screens/character-needs-help.md).

---

## События

`ALLOWED_EFFECT_KEYS` += `needs_delta`.

Приоритет для **soft**: больше событий с положительным `needs_delta` в tutorial-tier (контент-задача).

---

## API (кратко)

### Overview / period status

- `needs`, `needs_meta` (thresholds, `consequence_profile`, `character_label`)
- `treat_self`: `{ available, cooldown_periods_remaining, default_cost, options[] }`
- `needs_guide` или ссылка `guide_available: true`

### `TreatSelfOption`

```python
class TreatSelfOption(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    cost: float
    needs_delta: NeedsOverview  # partial deltas
```

### `POST /api/game/period/treat-self`

Body: `{ "option_id": string }` — обязателен.

### Period close

- `needs_zero_periods_streak`, `has_zero`, `is_distressed`, `defeat_triggered`, `defeat_reason`

---

## Frontend

**UX (approved):** [`docs/ux/CHARACTER_NEEDS_UX.md`](../../ux/CHARACTER_NEEDS_UX.md) · экраны в [`docs/ux/screens/`](../../ux/screens/) · lab [`design-lab/character-needs/`](../../../design-lab/character-needs/).

- `MqxNeedsDash` v7 — **Z-NEEDS** на главной: 4 шкалы всегда, портрет `PersonaPortrait`; пороги 40 / 30 / 0.
- **Сердце** → treat-self sheet ([`character-needs-treat-self.md`](../../ux/screens/character-needs-treat-self.md)); UI «Улучшить».
- **Книга+?** → `MqxNeedsHelpSheet` + `needs/guide` ([`character-needs-help.md`](../../ux/screens/character-needs-help.md)).
- **Студент:** баннер при <40 (`proactive_hints`); **Предприниматель:** без баннера.
- События: чипы `needs_delta` на choices ([`character-needs-events.md`](../../ux/screens/character-needs-events.md)).
- Закрытие месяца / defeat — [`character-needs-period-defeat.md`](../../ux/screens/character-needs-period-defeat.md).
- Выбор персонажа — [`character-pick.md`](../../ux/screens/character-pick.md).

---

## Тесты

- Decay: 72/12 → 6 per period; ~12 steps to 0.
- Zero streak: 0,0,0 on period 3 → defeat; reset if one period without zero.
- Treat-self: cooldown 14 → blocked, 15 → ok; option applies correct delta.
- Soft distressed: penalty 2% salary; hard 6%.

---

## Out of scope (фаза 1)

- Фильтр событий по персонажу (фаза 2).
- Campaign unlock (фаза 3).
- Decay от cash stress.
- Маслоу как 5-я шкала.

---

## Open questions (playtest)

| ID | Тема |
|----|------|
| PQ-01 | Точный `periods_to_empty_target` per template (10–14) |
| PQ-02 | Силы `needs_delta` в treat options и событиях |
| PQ-03 | Нужен ли штраф **и** при distressed **и** при zero в одном периоде (сейчас: да, разные эффекты) |
| PQ-04 | `rescue_event_bias` — только контент или веса в `ensure_period_events` |

---

## Implementation checklist

1. [ ] ADR-005, ADR-006 — **accepted**
2. [ ] Migration + seeds (`periods_to_empty_target`, **≥1** treat option per template, profiles)
3. [ ] `needs_engine`, `needs_guide_content`
4. [ ] API + period hook
5. [ ] UI: bars, treat sheet, help screen
6. [ ] Playtest: 15 периодов без treat-self → поведение шкал

---

## Связанные документы

- [ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md)
- [ADR-006](../../decisions/ADR-006-treat-self-options-and-cooldown.md)
- [game-character-needs-foundation.md](../../vision/ideas/game-character-needs-foundation.md)
- [architecture.md](../../architecture/architecture.md)
- UX: [CHARACTER_NEEDS_UX.md](../../ux/CHARACTER_NEEDS_UX.md) · [design-lab/character-needs/](../../../design-lab/character-needs/)
