---
layer: audits
kind: ai
status: draft
last_reviewed: 2026-09-07
audience: product, game-design, engineering, agents
doc_type: audit
verdict: DRAFT
source: ../ai/2026-09-07-runtime-and-dev-ai.md
related:
  - ../../plans/PLAN_production-ready.md
  - ../../audits/product/2026-09-07-product-game-design.md
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/ai
  - tvoy-hod/status/draft
aliases:
  - "Предложения по AI: кросс-роли"
  - AUDIT_ai-proposals_2026-09-07
---
# Предложения по улучшению AI: кросс‑функциональный анализ

**Kind:** `ai` · **Дата:** 2026-09-07 · **Verdict:** DRAFT.  
База: [аудит runtime/dev](2026-09-07-runtime-and-dev-ai.md). Очередь: [`PLAN_production-ready`](../../plans/PLAN_production-ready.md).  
Не канон. Не NPC/BT/GOAP/player-LLM. «Мир» игры = карточки периода + guidance FSM.

Слоты **PR-*** / **GO-*** уже в сводном плане — здесь не второй бэклог, а **зачем и кому**.

---

## Сводка

- **Количество предложений: 6**
- **Быстрая победа:** П1 — флаг пустого спавна (PR-14)
- **Стратегическое:** П6 — планировщик слотов + вынос picker из `period.py` (PR-23 + PR-25)
- **Главный компромисс:** GD хочет «умный мир» (больше адаптивности и карточек); Architect не даёт BT/ML до наблюдаемости и CI. **Решение:** сначала сигнал fail + pytest + лог решения; контент/слоты — после. Адаптивность уже есть (fatigue, needs-rescue) — не переписывать scoring «с пяти параметров с нуля».

Закрывают аудит: C1→П1, C3→П2, M1→П3, C2→П4, M2→П5, M3+DX→П6.

---

## Предложения

### Предложение 1: Честный fail cognition (быстрая победа)

- **Суть:** Если пул не собрал 2 `period_choice` после close — игрок и Watchtower это видят; месяц не выглядит «пустым миром» без причины.
- **Изменения в AI:** Action/cognition boundary: `ensure_period_events` возвращает результат (ok / empty_pool / exception), `period.py` больше не глотает в пустоту. Perception не меняется.
- **Влияние на игрока:** Редкий край — empty/error chip вместо «карточки пропали, игра сломана». Core loop тот же. Эмоция: доверие к правилам, не к магии.
- **Реализация:** `services/events/service.py` (код возврата + `logger` с `profile_id`/`period_index`); `game/period.py` прокидывает в close payload `events_spawn_failed`; FE close/hero или toast; Watchtower. Переиспользовать unit `test_period_event_pool_failure.py`. Не переписывать picker.
- **Ресурсы/риски:** **0.3 н.** Нет FPS. Риск: ложный флаг, если intro/chain считаются в пул иначе — сверить `_period_pool_instance_count`. Нет сети NPC.
- **Продуктовая ценность:** Не D7 напрямую; **fair-play / BLOCKER α**. Без этого WAVE1 портит NPS («баг контента»). RICE высокий при крошечном effort (аудит PR-14).
- **Критерии успеха:** pytest инжект fail → поле в JSON; 0 close без карточек и без флага; в WAVE1 счётчик флага = 0 или все случаи в Watchtower. **Не A/B.**

Оценки ролей:

- **AI Architect:** Высокая реализуемость. Debuggability cognition скачком вверх. Determinism не трогаем. Extensibility: контракт результата спавна пригодится слотам (П6).
- **Game Designer:** Не новая фантазия; чинит «мир умер». Не ломает 2 карточки/ход. Баланс не меняется.
- **System Architect:** Слабая связность: флаг в существующем close DTO. Не долг, если не плодить второй канал ошибок. CI: один TestClient-тест.
- **Product Owner:** **P0** (после lock close можно параллелить). ROI: репутация α. Стоимость низкая. Риск релиза: почти нет.

---

### Предложение 2: Pytest экономики как gate LLM-authoring

- **Суть:** PR с YAML/picker не зелёный без `pytest` (контракт событий + period). Cursor не единственный предохранитель.
- **Изменения в AI:** Dev-time pipeline, не runtime scoring. «Perception» агента = красный CI.
- **Влияние на игрока:** Косвенно: меньше выкатов «пустой пул / битый effect». Core loop не меняется в сессии.
- **Реализация:** `.github/workflows` required check; Pages `needs: test`. Переиспользовать `backend/tests/` (event taxonomy, pool, YAML contract). Не трогать `service.py` логику.
- **Ресурсы/риски:** **0.4 н** обвязки CI. Риск: минуты на PR (приемлемо). Не FPS. Flaky tests — чинить, не skip.
- **Продуктовая ценность:** Снижает вероятность сломанного билда у 10–20 тестеров → session/NPS. Не конверсия. Fair-play: цифры и карточки не врут из-за кривого seed.
- **Критерии успеха:** PR без pytest не merge; `pytest -k event` + period close в required. Нет A/B.

Оценки ролей:

- **AI Architect:** Критично для масштабирования каталога. Determinism тестов уже есть. Без этого authoring = рулетка.
- **Game Designer:** Не геймплей, но защищает задуманные карточки. Не мешает фантазии.
- **System Architect:** Правильный CI/CD. Версионирование YAML уже в git. **Снимает** долг Eng C1, не создаёт.
- **Product Owner:** **P0** (сводный PR-04). Конфликт: «CI тормозит» vs «сломанный Pages». Компромисс: required pytest, не полный coverage.xml в α.

---

### Предложение 3: Decision trace спавна (ключи + сжатый why)

- **Суть:** На каждый успешный spawn писать `definition_key[]`, размер пула, окно tier, `spawn_reason` (`core_window` | `fallback_p1` | `chain`). Support может ответить «почему эти две карты».
- **Изменения в AI:** Cognition → telemetry. Не менять веса в P1. Опциональный этап: `events_rng_seed` на профиль (**AI-01**, не всем).
- **Влияние на игрока α:** Обычно ничего. Ops/контент чинят повторы быстрее → игрок позже меньше «опять то же». Не объяснять scoring в UI 30+ в α (шум).
- **Реализация:** После pick в `ensure_period_events` — structured log + поле в `notification_log` или таблица `event_spawn_log` (минимально: JSON в существующий лог). Watchtower показывает ключи периода. Переиспользовать `notify_event_chosen` паттерн. Не дублировать в FE.
- **Ресурсы/риски:** Лог **0.4 н** (PR-28+). Seed на профиль **1 н**, риск «предсказуемый рандом» / fair-play — **только support**, выкл по умолчанию. Нет FPS. Нет bandwidth NPC.
- **Продуктовая ценность:** Не D1. Ускоряет контент-итерации → косвенно unique keys / D7. Fair-play: можем доказать, что пул не читится клиентом.
- **Критерии успеха:** 100% spawn с ключами в admin; баг «не та карта» воспроизводится по `period_index`+keys без догадок. Seed: отдельный pytest replay одного профиля. Не A/B.

Оценки ролей:

- **AI Architect:** Must-have для debug. Determinism: лог важнее seed в α. Extensibility под слоты (в лог добавится `slot`).
- **Game Designer:** Не эмоция игрока. Даёт GD инструмент не гадать. Компромисс: **не** показывать «вес 0.37» в MQX.
- **System Architect:** Не раздувать схему: сначала log/JSON, таблица — если объём. Coupling слабый. Версии: поле `schema` в payload.
- **Product Owner:** **P1** лог (с WAVE1); seed **P3**. Конфликт Architect «seed критичен для масштаба» → поэтапно: лог сейчас, seed после n≥20 багов контента.

**MVP vs полная:** MVP = ключи + pool_size. Полная = why-vector (fatigue, rescue, domain). Why-vector — P2, не блокирует волну.

---

### Предложение 4: Антиусталость контента (cooldown/once + уникальность)

- **Суть:** Политики `repeat_policy` / `cooldown_periods` довести так, чтобы за 10 ходов игрок видел ≥6 разных `definition_key`, а не paging одной темы. Picker уже умеет fatigue — **не хватает данных**, не новой utility с 5 осями.
- **Изменения в AI:** Data (YAML) + уже существующий `is_event_definition_eligible`. Cognition не переписывать. Authoring: create-event §10.
- **Влияние на игрока:** Core: тот же «два события». Meta: мир живёт, не крутится на одной карточке. Эмоция: любопытство, меньше «генератор штрафов». Риск баланса: меньше «бытовых» повторов → другой burn — нужен sim.
- **Реализация:** YAML mvp11 + pytest eligibility; не новый модуль. `taxonomy.effective_event_weight` оставить. Пак 8–10 ключей — create-event (PR-24), не этот же PR обязательно.
- **Ресурсы/риски:** **0.8 н** политики (PR-22) + контент отдельно. Риск: пул оскудеет → C1 чаще. Митигация: fallback P1 уже есть; следить spawn fail (П1). Не FPS.
- **Продуктовая ценность:** Product C2: гипотеза unique keys → меньше выгорания → шанс D7. Нет live D7 — не обещать пункты. NPS после 5p. Не монетизация.
- **Критерии успеха:** `event_chosen` unique / 10 close ≥6 (gate CA), ≥8 к P12 (таргет). Headless `balance_playtest` до/после. WAVE1 Q11 «листание». **Не A/B до n≥200.**

Оценки ролей:

- **AI Architect:** Правильный рычаг: data-driven. Не «сделать AI умнее». Риск пустого пула — мониторить П1.
- **Game Designer:** Соответствует fantasy «проживи месяц». Баланс: не резать все repeatable consumption без §10 класса B. Новые возможности: цепочки важнее новых осей utility.
- **System Architect:** Почти нет кода движка. Долг = дисциплина YAML. CI: контракт repeat/cooldown.
- **Product Owner:** **P1** после P0 honesty. Effort контента 2 н пака — P2. ROI: удержание mid-game, не FTUE.

**Конфликт:** GD может хотеть 4-ю карточку. Architect/PO: нет (размывает TB1). Компромисс: 2 choice + 1 informational (П6), не 4 choice.

---

### Предложение 5: Канон skip vs обязательный контент

- **Суть:** Явно решить в spec: close с неоткрытыми необязательными — ок педагогика или дыра cognition. Затем один код-путь (warn / block / auto-expire как сейчас).
- **Изменения в AI:** Policy на границе action (воля игрока) и cognition (спавн 2 карт). Не менять веса.
- **Влияние на игрока:** Либо свобода «не читать почту», либо «мир требует внимания». Смешение сейчас = случайное чувство вины. O3 учит открывать события — если skip ок, copy не должен стыдить.
- **Реализация:** Сначала **PR-13** spec (`SPEC_PRODUCT` / events). Код: либо soft-gate UI, либо `blocks_period_end` только mandatory (уже есть `mandatory_gate`). Не новый planner.
- **Ресурсы/риски:** Spec **0.2 н**; UI если block — 0.5 н. Риск: block повысит drop на close (FTUE). Не сеть.
- **Продуктовая ценность:** Честный FTUE. Unique keys метрика врёт, если skip. Не D1 магия.
- **Критерии успеха:** Запись в spec; 8 реплеев Q «закрыл не открыв — ок?»; pytest на выбранную политику. Не A/B в α.

Оценки ролей:

- **AI Architect:** Без политики телеметрия (П3–П4) лжет. Реализуемость высокая.
- **Game Designer:** Конфликт с «2 события/период» как обещание мира. **MVP:** skip разрешён, но close preview «N карточек не открыто». Полный block — после Q.
- **System Architect:** Спека снимает долг QA vs TB1. Код минимальный.
- **Product Owner:** **P1** spec (дёшево). Block-UI **P2**. Не P0.

**Компромисс GD vs QA:** QA видит дыру контента; GD — агентность. Принято в этом файле: **preview, не hard-block** в α.

---

### Предложение 6: Планировщик слотов + вынос picker (стратегическое)

- **Суть:** Cognition становится **планировщиком слотов**: `period_choice` ×2 + опционально `informational` (EVT1-030), без 4-й choice-карточки. Код пула вынести из вызова `period.py`, чтобы sim и close делили одну функцию.
- **Изменения в AI:** Архитектура cognition: `plan_period_content(profile_ctx) -> SlotAssignment[]`. Perception тот же. Pipeline: YAML `event_slot` уже есть — включить в runtime. Инструменты: spawn log с `slot` (П3).
- **Влияние на игрока:** Core loop: всё ещё 2 решения. Meta: «новость месяца» без trade-off — меньше paging, больше мира. Эмоция: разнообразие тона, не новый мини-гейм.
- **Реализация:** Новый модуль `app/events/period_plan.py` (или расширить `service.py` без циклов). `period.py` вызывает один use-case. Переиспользовать фильтры audience/tier/fatigue. Переписать только оркестрацию pick, не формулы веса. FE: UI informational (lab). Сиды YAML slot.
- **Ресурсы/риски:** Порт picker **2 н** (PR-25) + informational **2 н** (PR-23). Риск: dual UI, пустой info-слот. Не FPS (по-прежнему 1 close). Coupling: не тянуть FastAPI в sim. Версии YAML: EVT1 поля уже заложены.
- **Продуктовая ценность:** Q11 вниз; материал для LiveOps анонса пака. D7 гипотеза слабее, чем акт 1 победы, но дешевле ML. Нет монетизации.
- **Критерии успеха:** Sim без HTTP гоняет тот же `plan_period_content`; за 12p ≥3 informational; unique keys не падают; pytest слот не крадёт choice. Плейтест: «было что прочитать, не только выбирать». Не A/B.

Оценки ролей:

- **AI Architect:** Долгосрочная модель без BT. Extensibility: global/needs_risk слоты позже. Performance ок. Determinism: тот же RNG + лог слота.
- **Game Designer:** Новая возможность внутри fantasy. Риск размыть «ход = решения». **MVP:** info не блокирует close, не choice.
- **System Architect:** Снимает долг Eng M1 (`period` → events). Модульность ↑. Если оставить pick в `period.py` и накрутить слоты там — **новый долг**. Поэтому порт **до** или **вместе** с info, не после нагромождения.
- **Product Owner:** **P2** (после WAVE1 без BLOCKER). Architect считает критичным для масштаба каталога → поэтапно: (1) порт функции без нового слота, (2) informational. Не P0.

**Конфликт PO P2 vs Architect «надо для масштаба»:** этап 1 порта (PR-25) можно подтянуть к P1 **если** sim блокирует баланс-пак; иначе P2 как в сводном плане.

---

## План внедрения

Совпадает со сводным планом; здесь только AI-срез.

### Фаза 1: MVP и быстрые победы (P0–P1)

| Задача | Слот | Готовность |
|--------|------|------------|
| Fail-флаг close | PR-14 / П1 | JSON + pytest инжект |
| Pytest required | PR-04 / П2 | GitHub Checks |
| Lock close | PR-01…03 | cognition 1 раз / период |

Параллель: П1 с lock (разные файлы: events DTO vs row-lock).

### Фаза 2: Баланс и качество поведения (P1–P2)

| Задача | Слот |
|--------|------|
| Spec skip + preview | PR-13 / П5 |
| Spawn keys log | PR-28 / П3 MVP |
| cooldown/once | PR-22 / П4 |
| WAVE1 замер unique keys | PR-16 |

### Фаза 3: Долгосрочная архитектура (P2–P3)

| Задача | Слот |
|--------|------|
| Вынос `plan_period_content` | PR-25 / П6 этап 1 |
| Informational slot | PR-23 / П6 этап 2 |
| YAML-пак | PR-24 / П4 контент |
| Support-only rng_seed | AI-01 / П3 этап 2 |
| **Не делаем:** BT, player-LLM, 4-я choice, ML-агент |

---

## Метрики и проверка

Нет live D1/D7 — не выдумывать. FPS/pathfinding — N/A.

| Метрика | Сейчас | Таргет gate CA | Как проверить |
|---------|--------|----------------|---------------|
| Тихий пустой месяц | возможно | 0 без флага | pytest + Watchtower |
| Pytest на PR | нет | required | Checks |
| Spawn с ключами | нет | 100% | admin log |
| Unique keys / 10 close | неизвестно | ≥6 | `event_chosen` |
| Informational / 12p | 0 | ≥3 | после П6 |
| Q skip «ок?» | нет | решение spec | 8 реплеев |
| A/B scoring | — | не в α | n≥200 |

---

## Риски и компромиссы

| Конфликт | Решение |
|----------|---------|
| GD: больше адаптивности vs Arch: не BT/ML | Уже есть fatigue+rescue; рычаг = YAML и слоты, не новые оси «с нуля» |
| GD: 4 карточки vs PO/TB1 | 2 choice + 1 info (П6), не 4 choice |
| QA: block skip vs GD: агентность | Preview в α, block после Q (П5) |
| Arch: seed всем vs PO: fair-play / effort | Лог P1; seed support P3 (П3) |
| Arch: порт picker срочно vs PO: P2 | Этап 1 порта если sim блокирует пак; иначе P2 |
| «Умный AI» vs стратегия продукта | Один продукт Game (ADR-013); cognition служит TB1, не советнику-LLM |
