---
name: create-event
description: >-
  Creates and extends game events (EventDefinition seeds, choices, effects, chains).
  Use for /create-event or when adding scenarios for Student vs Professional personas,
  needs_delta, burn preview, and balance. Not a reviewer — co-author with checklists.
argument-hint: "[persona: student|professional, idea, or definition_key to clone]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

# Create Event (/create-event)

Помощник **авторинга** событий ТВОЙ ХОД. Вызывай: **`/create-event`**, «создать событие», «новое событие для студента».

**Не путать с:** **`/event-analysis`** (read-only обзор каталога) · `economy-reviewer` (ревью diff) · `mqx-ui-reviewer` (карточка UI).

## Прочитай сначала

- [`.cursor/skills/create-event/persona-profiles.md`](persona-profiles.md) — **Студент** / **Профессионал**, burn, needs
- [`docs/templates/EVENT_BRIEF.md`](../../../docs/templates/EVENT_BRIEF.md)
- [`data/events/mvp11/`](../../../data/events/mvp11/) — канон YAML (образец по домену)
- [`data/events/README.md`](../../../data/events/README.md)
- [`docs/specs/features/SPEC_mvp-11-progression-events.md`](../../../docs/specs/features/SPEC_mvp-11-progression-events.md)
- [`docs/vision/ideas/event-engagement-anti-fatigue.md`](../../../docs/vision/ideas/event-engagement-anti-fatigue.md)
- [`docs/vision/ideas/event-types-and-taxonomy.md`](../../../docs/vision/ideas/event-types-and-taxonomy.md)
- [`backend/app/events/constants.py`](../../../backend/app/events/constants.py) — `ALLOWED_EFFECT_KEYS`
- [`backend/app/events/choice_impacts.py`](../../../backend/app/events/choice_impacts.py) — burn preview

**Satellites:** `test-driven-development` (обязательно pytest); при сомнении в дублях/gaps — **`/event-analysis`**; при UI — `design-lab-mqx`.

## Канон и БД ([ADR-008](../../../docs/decisions/ADR-008-events-catalog-single-source.md))

- **В git:** `data/events/mvp11/*.yaml` — domain-файлы, массив `events:`; оглавление `catalog.yaml`.
- **Loader:** `backend/app/events/mvp11_catalog.py` (кэш при старте процесса).
- **В БД:** `ensure_mvp11_event_catalog()` в `mvp11_seeds.py` — upsert из YAML.
- **Не писать** контент в `migrations/*.sql`.
- После правки YAML — **перезапуск backend** локально; на prod — деплой.
- Brief: `docs/vision/ideas/event-briefs/` — опционален ([`data/events/README.md`](../../../data/events/README.md)).

---

## Роль

Ты **соавтор контента**, не ревьюер. Помогаешь:

1. Не забыть поля (tier, mode, taxonomy, repeat, cooldown, prereq).
2. Сгенерировать **копирайт и цифры** под персону (тон, salary, needs, burn).
3. Дать **парный** вариант (студент / профессионал) с **разными keys**.
4. Добавить событие в нужный `data/events/mvp11/<domain>.yaml` (массив `events:`).
5. Предложить тест и прогнать pytest.

---

## Workflow

### 0. Уточни у пользователя (если не сказано)

- Персона: **student** (`mq_game_basic_v1`) | **professional** (`mq_game_tight_budget_v1`) | **обе**
- Идея одним предложением
- Механика: soft_offer | mandatory | chain | клон существующего key

### 1. Event Brief

Заполни [`EVENT_BRIEF`](../../../docs/templates/EVENT_BRIEF.md) (в чате или `docs/vision/ideas/event-briefs/<key>.md`).

### 2. Выбери образец

Найди ближайший event в `data/events/mvp11/<domain>.yaml` (тот же `event_domain` / shape). При крупном домене или риске дубля — сначала **`/event-analysis`** по scope. **Вариант B = новый `definition_key`**, не массив variants.

### 3. Персона и фильтр пула

| Персона | template_key | Персонализация сейчас |
|---------|--------------|------------------------|
| Студент | `mq_game_basic_v1` | тон, суммы от ~62.5k, needs social/health, без авто-prereq |
| Профессионал | `mq_game_tight_budget_v1` | тон карьера, ~100k, needs status/comfort, prereq `car_personal` / `leased_dwelling` |

**audience_json по template** — запланировано (architecture § Фаза 2), в prod **нет**. До внедрения:

- события «только для про» → `prerequisites_json.active_asset_kinds_any: ["car_personal"]` и т.п.;
- «только студент» → `forbid_active_asset_kinds_any: ["car_personal"]` или отдельные keys без car prereq у про-веток.

Сообщи пользователю, если событие должно быть **строго** template-only — нужна задача на движок (filter в `ensure_period_events`).

### 4. Effects и баланс

- Только ключи из `ALLOWED_EFFECT_KEYS`.
- **`needs_delta`:** 1–3 оси, см. persona-profiles; rescue — `metadata_json.is_rescue` + `rescue_axes`.
- **`cash_delta`:** ориентир % от `monthly_salary` (таблица в persona-profiles).
- **`monthly_burn_delta_pct`:** объясни игроку рост burn; прикинь `burn_now * pct` для персоны.
- Цепочки: `enqueue_event`, отдельный followup key — [`event-catalog-qna-refine.md`](../../../docs/vision/ideas/event-catalog-qna-refine.md).

### 5. Код (канон → БД)

1. Выбрать файл в `data/events/mvp11/` (или новый domain-файл + строка в `catalog.yaml` `includes`)
2. Добавить объект в `events:` (`definition_key`, `event_domain`, `title`, `choices`, …)
3. Опционально: brief в `docs/vision/ideas/event-briefs/<key>.md`
4. SQL-миграция контента — **не использовать** (ADR-008)

### 6. Verify

```bash
cd backend && python -m pytest -q -k "event"
```

При новом key — добавь или расширь тест (pool, choose, impacts).

---

## Генерация пары Student / Professional

Если пользователь просит «одну механику, два профиля»:

1. Опиши общую механику (домен, tier, 2–3 choice structure).
2. Сгенерируй **два** brief + **два** key (`_student`, `_pro`).
3. Суммы и needs_delta масштабируй по salary и persona-profiles.
4. Pro-версия: лексика «офис / встреча / аренда», student — «учёба / друзья / общежитие».

---

## Детали, которые нельзя забыть

- [ ] `event_tier` в окне прогрессии ([`SPEC_mvp-11`](../../../docs/specs/features/SPEC_mvp-11-progression-events.md))
- [ ] `mode: game` (plan — отдельно)
- [ ] `repeat_policy` + `cooldown_periods` для repeatable
- [ ] 2–3 choice; у soft_offer отказ = 0 ₽ где уместно
- [ ] `impacts` честные (cash, burn, needs) — см. choice_impacts
- [ ] Отдельный key для варианта контента
- [ ] Brief сохранён или вставлен в чат

---

## Согласование

Перед записью в репо: **Могу записать** событие(я) в `data/events/mvp11/` (и опционально brief)?

Покажи пользователю **черновик карточки** (title, description, кнопки с суммами и needs) до записи.

---

## Verdict

**COMPLETE** — brief + код + pytest green  
**CONCERNS** — код есть, pytest не гоняли или нет brief  
**BLOCKED** — нужен фильтр по template в движке (опиши задачу)

---

## Следующий шаг

- Ещё события → снова `/create-event`
- UI карточки → `design-lab-mqx` + `mqx-ui-reviewer` по запросу
- Движок пула → `game-economy-and-victory` или отдельная spec-задача на `audience_json`
