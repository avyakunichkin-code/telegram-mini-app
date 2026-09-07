---
layer: audits
kind: ai
status: draft
last_reviewed: 2026-09-07
audience: engineering, content, agents, product
doc_type: audit
verdict: DRAFT
source: code 2026-09-07 + audits product/engineering/qa same day + catalog.yaml + create-event skill
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/ai
  - tvoy-hod/status/draft
aliases:
  - "AI-аудит runtime и dev-pipeline"
  - AUDIT_ai_2026-09-07
---
# AI-аудит: ТВОЙ ХОД (пошаговый финансовый симулятор)

**Kind:** `ai` · **Дата снимка:** 2026-09-07 · **Verdict:** DRAFT (не канон, не ADR).

Канон адреса: [`../README.md`](../README.md). Kind: [`README.md`](README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

Смежные снимки того же дня: [engineering](../engineering/2026-09-07-architecture.md) · [qa](../qa/2026-09-07-mechanics.md) · [product](../product/2026-09-07-product-game-design.md). Предложения кросс-роли: [`2026-09-07-ai-proposals.md`](2026-09-07-ai-proposals.md). Очередь работ: [`PLAN_production-ready`](../../plans/PLAN_production-ready.md) — этот аудит **не** заводит второй roadmap.

Это **не** Unity/Unreal. Нет NPC, NavMesh, behavior tree, GOAP, ML-Agents, player-facing LLM. Применять чеклист «боевого AI» буквально — ошибка жанра. Ниже стек разобран **как есть**: perception → cognition → action в терминах периода и карточек.

---

## Сводка

- **AI-стек (факт):**
  - **Runtime:** взвешенный random без возвращения + diversity `event_domain` + fatigue по счётчикам + audience/prerequisites/tier-окно + needs-rescue multiplier (utility-lite) + отложенные цепочки (`enqueue` / follow-up) + **FSM** guidance O3 (curriculum beats).
  - **Dev-time:** Cursor LLM + skills (`create-event`, `event-analysis`, `balance-playtest`) + `skill-test` в CI + YAML ADR-008 + seeded `balance_simulate`.
  - **Нет:** BT / HTN planner / MCTS / RL / imitation / PCG уровней / AI-агенты в плейтесте / сетевой AI NPC.
- **Общая AI-зрелость: 5 / 10.** Picker и data-driven YAML — Closed Alpha (7/10). Наблюдаемость решений и объём уникального контента — прототип (3/10). Dev-pipeline скиллов сильный процесс, но **не** gate экономики (pytest вне PR CI).
- **Проблемы:** 🔴 **3** · 🟡 **7** · 🟢 **4**
- **Главный AI-риск:** игрок получает «мир» из двух карточек за ход, а cognition либо **молчит** (пул упал / skip), либо **повторяет** одни ключи на дистанции 40–60 ходов — поведение читается как глупый RNG, хотя модель выбора адекватна жанру.
- **Топ-3 приоритета:**
  1. Не оставлять месяц без карточек без сигнала игроку/Watchtower (C1; **PR-14 = P0-parallel** в сводном плане после кросс-ролей).
  2. Pytest + YAML-контракт в CI, чтобы LLM-authoring не катил сломанный пул (C3; PR-04).
  3. Уникальность историй / cooldown / info-слот — иначе diversity picker не спасает (C2; PR-22/23, V2-BAL).

### Что работает — ориентир

| Система | Почему якорь |
|---------|----------------|
| Picker `_pick_diverse_period_events` | Weighted sample −ln(U)/w, без повтора в батче, разные `event_domain` | `services/events/service.py` |
| Fatigue `effective_event_weight` | Utility: вес падает с `times_selected` | `events/taxonomy.py` |
| Needs-rescue multiplier | Адаптация к самой низкой оси needs | `_rescue_weight_multiplier` |
| Цепочки | Запланированный follow-up, не «ещё один random» | `ensure_scheduled_chain_events` |
| YAML + `balance_contract` | Data-driven контент, не скрипт NPC | ADR-008, `data/events/mvp11/` |
| O3 curriculum | Явный FSM, server `guidance/engine.py` ≈ FE `curriculum.js` | не LLM в рантайме |
| `balance_playtest` seed 42 | Replay-safe **сим**, не прод | `balance_simulate.py` |
| Skills + satellites | create-event → TDD → event-analysis; subagents reviewer | `catalog.yaml` |
| Server-authoritative spawn | Клиент не выбирает `definition_id` пула | `ensure_period_events` на close |

---

## Источники и пробелы в данных

**Читали:** `backend/app/services/events/service.py`, `events/taxonomy.py`, `game/period.py` (обёртка пула), `guidance/{curriculum,engine}.py`, `scripts/balance_{simulate,playtest}.py`, `.cursor/skills/{catalog.yaml,create-event,balance-playtest}`, `.github/workflows/skills-check.yml`, `.cursor/hooks.json`, аудиты 2026-09-07 product/engineering/qa.

**Нет (не выдумывать):**

- p95 времени `ensure_period_events` на prod.
- Доля месяцев с 0/1/2 pending карточками в live.
- Unique `definition_key` / 10 ходов у реальных игроков (WAVE1 не шла).
- Стоимость Cursor-токенов / rate-limit LLM.
- ML training metrics — **моделей нет**.
- Плейтест-видео «NPC застрял» — нет NPC.
- Логи Render с `Period event pool failed` (QA тоже не имел выгрузки).

---

## 1. Архитектура игрового AI

**Выбранная модель.** Для 2 карточек/период из YAML-каталога (~60 `definition_key`) **взвешенный random + фильтры + лёгкий utility** — правильный жанровый выбор. BT/GOAP/MCTS/RL — YAGNI: нет пространственной навигации, нет тактического боя, нет непрерывного tick. «Планировщик» уже есть в узком виде: **цепочки** (решение в периоде N → инстанс в N+k).

**Слои (факт, не учебник NPC):**

| Слой | Что в ТВОЙ ХОД | Граница |
|------|----------------|---------|
| Perception | Снимок профиля: `save_kind`, `period_index`, audience, prerequisites, needs, счётчики, активные цепи | SQL + `_load_event_profile_context` |
| Cognition | Фильтр пула → tier window → diversity sample → rescue weights | `ensure_period_events` |
| Action | Создать `EventInstance` pending; игрок выбирает choice на сервере | не pathfinding |
| Memory | `EventProfileCounter`, chain tables, `guidance_progress_json` | нет shared squad blackboard (1 игрок) |
| Coach | O3 beats/triggers — отдельный FSM, не picker | `guidance/engine.py` |

Связанность: picker живёт в `services/events`, вызывается из `period.py`. Это ясно, но **падение cognition глотается** (C1). Guidance не читает «почему выпала карточка» — два мозга без общей explanation layer.

**Модульность.** Новый «NPC» = новый YAML + seed, не копия Python. Пресеты = шаблоны старта + `audience`. Новый скилл карточки = `effects_json` ключ в allowlist. Расширяемость контента высокая; расширяемость **слотов** (informational / global) — EVT1-030 ещё не в планировщике.

**Data-driven vs script.** Контент — YAML. Политика пула — код (`EVENTS_PER_PERIOD`, tier windows, fatigue factor). Guidance copy — Python/JS константы, не CMS. Hot-reload пула в живой партии нет (нужен close / seed).

### Находки

🔴 **C1. Cognition fail → пустой месяц без UI.** `period.py` ловит любое исключение `ensure_period_events`, пишет `Period event pool failed…`, период всё равно закрыт. Пустой `repeat_ok` / пустой P1 — `return` с `logger.error`, без флага в ответе close. Игрок: «пропали карточки». QA M2 / Eng M17 (лог есть, игрока нет). **Решение:** флаг `events_spawn_failed` в close payload + Watchtower (**PR-14**, P0-parallel с lock close). Effort 0.3 н. Не «добавить BT».

🟡 **M1. Нет replay cognition в prod.** `_weighted_sample_without_replacement` берёт `random.random()` **без seed**. Сим `balance_simulate` сидит `random.seed(42)` на процесс — это **другой мир**. Баг «почему эта карта» не воспроизводится. **Решение:** лог `{profile_id, period_index, picked_keys, pool_size, window}` на spawn (PR-28 расширить на spawn, не только choose); опционально `events_rng_seed` на профиль для support-replay (P2, не P0). Effort лога 0.4 н; seed на профиль 1 н + этика «предсказуемый рандом».

🟡 **M6. Фильтр `mode == save_kind \| any` всё ещё знает `plan`.** После ADR-013 это мёртвая ветка cognition. Долг **GO-04**. Effort 0.4 н.

🟢 **m4. Curriculum дублируется FE/BE.** `guidance/curriculum.py` зеркало `frontend-react/src/guidance/curriculum.js`. Риск drift (уже UX смесь ход/месяц). Не ломает picker. **Решение:** один JSON-источник или тест на равенство id/gate. Effort 0.3 н.

---

## 2. Качество поведений

Читаемость: игрок видит заголовок карточки, **не** видит scoring (fatigue, rescue, domain). Для midcore 30+ это нормально, если карточки разнообразны. Если нет — мир кажется «рандомным генератором бед».

Адаптивность: **есть** (needs-rescue, audience, prerequisites, cooldown/repeat_policy в данных). **Нет** реакции на «тактику игрока» сверх состояния сейва — и не должно быть ML.

Difficulty: `event_tier` от `period_index`, не отдельный AI difficulty slider. Корректно для канона без character XP.

Edge: нет цели = пустой пул (C1). «Застрял на NavMesh» — N/A. Конфликт целей = две карточки + mandatory_gate; skip необязательных — отдельный баг качества.

Emergent: не «ходят кругами», а **повтор ключей** и **paging trade-off** (product M1). Цепочки — желаемый эмерджент.

### Находки

🔴 **C2. Diversity-алгоритм не спасает тонкий каталог.** ~60 ключей (часть persona-only / узлы цепей) vs 2 показа × 40–60p. Picker честно разводит `event_domain` в **одном** периоде; на дистанции 10 ходов α-FB-03 уже про повторы. Поведение «глупое» из-за **контента**, не из-за FSM. Product C2. **Решение:** не писать GOAP; cooldown/once (**PR-22**), info-слот (**PR-23**), пак 8–10 ключей (**PR-24**), акт 1 короче (**PR-18**). Effort — как в сводном плане.

🟡 **M2. Skip необязательных при close.** Cognition заспавнила 2 карточки; action execution игрока может их не открыть. QA vs spec TB1. **Решение:** spec (**PR-13**), не «приоритет в BT».

🟡 **M3. Слот informational / global не в runtime-планировщике.** Taxonomy в YAML/EVT1-020 есть; мульти-слот EVT1-030 ⬜. Все живые picks — `event_slot == period_choice`. Diversity только внутри одного класса. **Решение:** PR-23, не нейросеть новостей.

🟢 **m3. Rescue скрыт.** Игрок не понимает, почему «опять здоровье». Для 30+ можно одна строка в Watchtower, не в UI α.

---

## 3. AI-инструменты разработки

**Интеграция.** Сильная: router → один primary skill, `must_read`/`read_if`, create-event чеклисты §10/§11, event-analysis read-only, balance-playtest + subagent `economy-balance-runner`, hooks `afterFileEdit` / `sessionStart`, `skills-check.yml` (static/context/category/archived).

**Генеративный контент.** Карточки пишет LLM **через навык**, не API в prod. Валидация: brief + pytest `balance_contract` **если прогнали**. Human-in-the-loop = ревью PR. Fallback при сбое LLM — человек правит YAML; рантайм не зовёт модель.

**LLM-ассистенты.** Нет temperature/top-p в репо (это Cursor). Нет кеша промптов, нет cost dashboard. Guardrails: `clarify-first`, `release-ready-quality`, `visual-assets-policy` (не GenerateImage без OK), `skill-responsibility-matrix`.

**AI-driven testing.** Headless **policy-бот** в `balance_simulate` (жадный cash), не LLM-игрок. Нет anomaly detection плейтеста. Нет regression через агента в CI.

**PCG.** Нет WFC/карты. «Процедурность» = RNG пула из authored set.

**CI.** Skills static — да. Pytest экономики — **нет** (C3).

### Находки

🔴 **C3. LLM может смержить регрессию пула: pytest не required на PR.** `skills-check.yml` не запускает `pytest`. Engineering C1 / QA C5. Для AI-пайплайна это **единственный автоматический предохранитель authoring**. **Решение:** PR-04. Effort 0.4 н.

🟡 **M4. Нет eval-harness на YAML.** create-event требует pytest вручную; нет «LLM-as-judge» и не надо в P0. Нужен **обязательный** `pytest -k event` в CI (то же PR-04) + event-analysis перед крупным паком.

🟡 **M5. Сим ≠ прод RNG.** seed 42 в playtest; прод без seed. Diff баланса не объясняет live «не та карта». **Решение:** не уравнивать прод с seed 42 (убьёт разнообразие); логировать ключи (M1).

🟢 **m1. Hooks не гоняют pytest.** `after-edit-verify.mjs` — напоминания, не test gate.

---

## 4. Производительность AI

**Tick cost.** Нет per-frame AI. Picker: O(|defs|) ≈ десятки строк, 2 раза за close. LOD / multithreading / NavMesh — **не применимо**. Спайк close = экономика периода, не AI.

**Memory.** Счётчики на (profile × definition), не раздутый blackboard на агента.

**Profiling.** Нет AI overlay. Watchtower видит `event_chosen` после выбора, не spawn-set.

🟢 Нет P0/P1 по CPU AI. 🟡 стоимость **DX**: `period.py` → `services.events` мешает sim без FastAPI (Eng M1/M7, **PR-25**) — это не FPS.

Не ставить таргет «ms per frame» / «max concurrent agents» — вводит в заблуждение. Таргеты ниже в метриках — **spawn success, unique keys, log completeness**.

---

## 5. Сетевой AI и синхронизация

**Не применимо** как NPC-netcode (нет клиентской симуляции агентов, нет bandwidth на steering).

**Применимо как game-AI authority:**

- Решение пула — **сервер** на `process_period_end`. Клиент не присылает `definition_id` спавна. Anti-cheat на «выбрать себе карточку» закрыт.
- Bandwidth: инстансы в bootstrap/overview, не tick stream.
- Replay-safety **партии**: экономика детерминирована после выбора; **набор** карточек — нет (M1).
- Latency: TB1 без таймера; prediction AI не нужен.
- Клиент может не выбрать карточку до close (M2) — не чит денег, дыра контента.

Не строить lockstep AI. Нужен spawn-лог, не delta-compression агентов.

---

## 6. Безопасность и этика AI

**Player-facing LLM — нет.** Monetka = скриптованный curriculum, не chat. Prompt injection в игру **не применим**. Не включать советника-LLM в α (product freeze CTA).

**Generative в пайплайне:** YAML/иллюстрации через агента. Moderation = human PR + balance rules (trade-off, не «халява needs+»). `visual-assets-policy` — HITL до GenerateImage.

**Bias:** педагогический (шаблоны Студент/Профи, события «как жить»). Нет ML-рекомендателя кредитов. Риск: LLM пишет морализаторские или токсичные формулировки — ловится ревью, не классификатором.

**Privacy:** игрок не кормит модель в runtime. Dev: код репозитория в Cursor — отдельный вопрос workspace, не игровой ML consent.

🟢 **m2.** Не обещать «AI-советник» в маркетинге, пока нет модели и guardrails. CustDev советника = PR-34, не runtime LLM.

---

## План доработки

Не параллельный бэклог: ID ниже = слоты в [`PLAN_production-ready`](../../plans/PLAN_production-ready.md). **Не** внедрять BT/GOAP/ML-Agents.

### Фаза 1: Стабилизация AI (P0)

**Вход:** как сводный P0 (lock close можно параллельно: другие файлы).  
**Выход:** месяц без карточек виден в API/Watchtower; сломанный YAML не проходит CI.

| ID | Что | Зачем | Результат | Effort | Зависимости | Плейтест / sim |
|----|-----|-------|-----------|--------|-------------|----------------|
| **PR-14** | Флаг `events_spawn_failed` | C1 | Игрок/ops видят fail cognition | 0.3 н | — | Инжект fail (уже unit) + UI |
| **PR-04** | pytest + event contract в CI | C3 | LLM не катит мёртвый пул | 0.4 н | — | CI |
| **PR-01…03** | Lock close (не AI, но cognition на close) | Двойной spawn/expire | 1 cognition / период | см. план | — | concurrent pytest |

**Не в P0:** seed на профиль, нейросеть, info-слот, BT inspector.

### Фаза 2: Качество поведений (P1)

**Вход:** P0 exit. **Выход:** на 10 ходах больше уникальных ключей; skip-политика в spec; WAVE1 без «Скоро».

| ID | Что | Зачем | Результат | Effort | Плейтест |
|----|-----|-------|-----------|--------|----------|
| **PR-13** | Spec skip vs mandatory | M2 | Канон cognition vs воля игрока | 0.2 н | Q в WAVE1 |
| **PR-22** | cooldown/once | C2 | unique keys / 10p ↑ | 0.8 н | `event_chosen` |
| **PR-18/19** | Акт 1 / гипотеза подушки | C2 длина кампании | Меньше показов до смысла | spec first | sim + 8 реплеев |
| **PR-16** | WAVE1 | замерить unique keys live | База метрик | после P0+GO-01 | люди |

GO-01 не AI, но убирает ложный «второй режим мира».

### Фаза 3: Оптимизация / наблюдаемость (P1–P2)

Нет FPS-фазы. Здесь **replay и DX**.

| ID | Что | Зачем | Effort |
|----|-----|-------|--------|
| **PR-28** + spawn log | `definition_key` на spawn | M1 | 0.4 н |
| **PR-25** | Port picker из `period.py` | sim без HTTP | 2 н |
| **GO-04** | `mode: plan` → any | M6 | 0.4 н |
| **AI-01** | Опционально `rng_seed` на профиль (support) | replay support | 1 н; **не** включать всем |

### Фаза 4: Tooling и pipeline (P2–P3)

| ID | Что | Зачем | Effort | Не делать |
|----|-----|-------|--------|-----------|
| **PR-23/24** | Info-слот + YAML-пак | M3, C2 | 2+2 н | 4-я карточка period_choice |
| event-analysis на пак | §10/§11 audit | M4 | в срезе create-event | LLM-as-judge в prod |
| skill-test уже в CI | процесс | — | расширять static, не RL | |
| **PR-34** | CustDev советника | этика | 2 н | chat-LLM в игре |

---

## Метрики AI production-ready

Метрики «FPS / path length / KB/s на агента» **сняты**: нет агентов. Подстановки — измеримые в этом стеке.

| Метрика | Сейчас | Gate «звать CA» | Таргет production | Как мерить |
|---------|--------|-----------------|-------------------|------------|
| AI tick ms/frame | N/A | — | не ставить | нет tick |
| Max concurrent AI agents | N/A (1 профиль / сессия) | — | — | — |
| Spawn success (2 pending после close, исключая intro) | нет live | 100% в pytest инжекта + 0 тихих fail в WAVE1 | 100% n≥50 | флаг PR-14; SQL pending count |
| Unique `definition_key` / 10 close | α-FB-03 (качественно) | ≥6 | ≥8 к P12 | `event_chosen` |
| Decision latency стимул→карточка | 1 close (ход) | ок для TB1 | не real-time | — |
| Pathfinding success | N/A | — | — | — |
| Network AI KB/s | N/A | — | bootstrap only | — |
| Picker replay: лог ключей на spawn | нет | ключи в admin | 100% spawn | PR-28 |
| Pytest event/period в CI | нет | required | required | GitHub Checks |
| skill-test static | есть | держать | COMPLIANT | `skills-check.yml` |
| Generative rejection % | нет данных | human PR | не KPI α | ревью YAML |
| NPC bug / час | N/A | — | — | заменить: BLOCKER «пустой месяц» = 0 |

---

## Риски и митигация

| Риск (шаблон геймдев-AI) | У нас | Митигация |
|--------------------------|--------|-----------|
| Non-deterministic replay | Прод-пул без seed | Лог ключей; seed только support (AI-01) |
| ML degradation после патча | **Нет ML** | Не заводить player-model до D7 и spec |
| LLM cost spike | Cursor-места, не runtime | Не звать API из FastAPI; паки YAML вручную |
| Emergent exploit AI | Skip событий; пустой пул; не «агр сквозь стены» | PR-13, PR-14; экономика уже server-side |
| Нет AI debug в проде | Нет overlay; Watchtower частичный | Spawn log + флаг fail |
| Агент пишет вредный совет как карточку | Authoring bias | create-event trade-off + human review; не LLM в рантайме |
| Смешать этот аудит с «надо BT» | Анти-паттерн | Явно YAGNI в ADR при споре |

## Не делаем (в этом снимке)

- Behavior trees, GOAP, HTN, MCTS, ML-Agents, neural NPC.
- Player-facing chat / советник-LLM.
- AI LOD, NavMesh, formation, crowd.
- Второй план вместо `PLAN_production-ready`.
- Смена правила подушки «потому что utility AI» — это GD spec (PR-19).
