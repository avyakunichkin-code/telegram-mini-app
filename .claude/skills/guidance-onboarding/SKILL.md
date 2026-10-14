---
name: guidance-onboarding
description: >-
  O3 onboarding guidance for ТВОЙ ХОД — spine curriculum beats (P1/P2), contextual
  triggers, gates, nudges after guidance, GameProfile onboarding_state/step and the
  Monetka guidance strip. Use when adding or editing a beat, trigger, gate or guidance
  text, changing GET/PATCH /api/game/guidance, the period-close guidance hooks, or
  GameGuidanceLayer / src/guidance on the frontend.
argument-hint: "[beat | trigger | gate | nudge | strip | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(python -m pytest *), Bash(py -3 -m pytest *), Bash(node --test *)
paths:
  - "backend/app/guidance/**"
  - "frontend-react/src/guidance/**"
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# Guidance & Onboarding (O3)

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/specs/features/SPEC_onboarding-o3.md`](../../../docs/specs/features/SPEC_onboarding-o3.md) — канон: spine 5+1, триггеры, API (O2/O1 spec — redirect, superseded)
- [`backend/app/guidance/engine.py`](../../../backend/app/guidance/engine.py) — прогресс, gates, выбор шага, PATCH-actions, хуки, nudges
- [`backend/app/guidance/curriculum.py`](../../../backend/app/guidance/curriculum.py) — `CURRICULUM` (spine-биты), тексты Монетки
- [`backend/app/guidance/triggers.py`](../../../backend/app/guidance/triggers.py) — `TRIGGERS`, `O2_BEAT_TO_TRIGGER`
- [`frontend-react/src/guidance/curriculum.js`](../../../frontend-react/src/guidance/curriculum.js) — FE-зеркало + правила блокировки событий/закрытия

**Satellites:** `test-driven-development` (поведение gates), `frontend-ui-engineering` (strip/MQX), `api-and-interface-design` (поля `GuidanceOverview`).
**Дальше:** `test-driven-development`, `frontend-ui-engineering`, `code-review-and-quality` (`catalog.yaml` → `next_skill`).

## Читай при условии (`catalog.yaml` → `read_if`)

| Когда | Файлы |
|-------|--------|
| хук закрытия периода / nudges | [`backend/app/game/period.py`](../../../backend/app/game/period.py) (блок `on_period_closed_guidance`) |
| intro событий / `t_events_intro` | [`backend/app/services/events/spawn.py`](../../../backend/app/services/events/spawn.py), [`backend/app/game/rules.py`](../../../backend/app/game/rules.py) |
| strip / якоря / UI | [`GameGuidanceLayer.jsx`](../../../frontend-react/src/components/GameGuidanceLayer.jsx), [`useGuidanceAnchorFocus.js`](../../../frontend-react/src/guidance/useGuidanceAnchorFocus.js), [`guidanceAnchors.js`](../../../frontend-react/src/guidance/guidanceAnchors.js) |
| воронка онбординга в админке | [`backend/app/admin/onboarding_funnel.py`](../../../backend/app/admin/onboarding_funnel.py) → дальше skill `admin-ops` |
| голос Монетки / тексты | [`docs/reference/CHARACTER_MONETKA.md`](../../../docs/reference/CHARACTER_MONETKA.md) |
| история O1/O2, legacy-биты | [`docs/archive/onboarding-o2/README.md`](../../../docs/archive/onboarding-o2/README.md) |

## Модель (как устроено в коде)

| Сущность | Где | Суть |
|----------|-----|------|
| **Beat** (spine) | `GuidanceBeat` в `curriculum.py` | `id`, `period_index` (1 или 2), `module_step`/`module_step_count`, `gate`, `title`, `body`, `debrief_body` |
| **Trigger** | `GuidanceTrigger` в `triggers.py` | после spine; `order`, `gate` ∈ `read`/`action_event`/`farewell`, опц. `screen` |
| **Gate** | `_gate_satisfied` / `_trigger_gate_satisfied` | `read`/`farewell` — только кнопкой «Понятно»; `action_*` — авто по состоянию БД |
| **Progress** | `User.guidance_progress_json` | `completed_beats`, `completed_triggers`, `view_beat_id`, `p1_close_debrief`, `events_chosen_p2`, `last_screen_enter`, `dismiss_skip_count` |
| **Финал** | `complete_guidance` | `User.guidance_completed=1` + `guidance_completed_at`; профиль → `onboarding_state="brief_done"`, `onboarding_step="farewell"`; алерт `notify_onboarding_brief_done` |
| **Nudge** | `_build_nudge_block` | только после `guidance_completed=1`: `nudge_salary_miss` / `nudge_negative_close` по стрикам профиля |

**Порядок выбора в `build_guidance_overview`:** `guidance_completed` → nudge или пусто · `_sync_auto_gates` (может закоммитить) · spine не пройден → `_first_incomplete_spine_beat` (+ `view_beat_id` для навигации внутри модуля) · spine пройден → `_pick_active_trigger` (сначала `last_screen_enter`, потом триггеры без `screen`) → `t_farewell`, когда остальные закрыты → `complete_guidance`.

**Spine complete** = `p1_close` и `p2_new_month` в `completed_beats`. `p1_close` закрывается **только** через debrief: закрытие P1 ставит `p1_close_debrief=True` → «Понятно» (`advance_read`) отмечает бит.

**API:** `GET /api/game/guidance` и `overview.guidance` в `GET /api/finance/overview` (`overview_build.py`) — одна схема `GuidanceOverview` (`schemas.py`). `PATCH /api/game/guidance` → `GuidancePatchRequest{action, beat_id, view_index, trigger_id}`; actions: `skip_all`, `screen_enter`, `dismiss_beat`, `advance_read`, `nav`, `event_chosen`, `p1_close_debrief`, `complete_beat`. `POST /guidance/replay` → 501. Отдельно `PATCH /api/game/profile/onboarding` (`services/game/profiles.py`) — шаги `_ONBOARDING_STEPS` + алерты.

## Хуки в core loop

- **Закрытие периода** (`process_period_end`, `game/period.py`): `update_nudge_streaks_on_period_close(profile, salary_claimed, cash_end)` → `salary_miss_streak` / `negative_close_streak`; затем `on_period_closed_guidance(db, user_id, profile, period_index)` — при закрытии P1 включает debrief. Оба в `try/except` с `logger.warning`: сбой guidance **не** ломает закрытие месяца. Хук не коммитит — изменения уходят в commit периода.
- **Выбор события** (`services/events/choose.py`): после commit выбора → `on_event_chosen` → `patch_guidance(action="event_chosen")`.
- **Старт игры** (`services/game/start.py`): если `guidance_completed=1`, новый профиль сразу `brief_done/farewell`.
- **Legacy intro событий** (`services/events/spawn.py`): `_o2_guidance_replaces_events_intro` — пока guidance не пройден, `mq11_events_unlock_intro` не создаётся.

## Procedure

### 1. Spec gate

Новый бит/триггер/смена gate — игроко-видимое правило: сначала правка таблиц в `SPEC_onboarding-o3.md` (+ Acceptance). Тексты — голосом Монетки ([`CHARACTER_MONETKA.md`](../../../docs/reference/CHARACTER_MONETKA.md)), лексикон «ход / Завершить ход» как в текущих битах.

### 2. Red — тест

Добавь сценарий в [`backend/tests/test_guidance_o2.py`](../../../backend/tests/test_guidance_o2.py) (fresh start → PATCH → проверка `beat_id` / `completed_beats`). Фикстуры: `client`, `auth_headers`, `db_session`; старт — `POST /api/game/start` с `template_key: mq_game_basic_v1`.

### 3. Green — где менять

| Задача | Файлы |
|--------|-------|
| Новый spine-бит | `CURRICULUM` в `curriculum.py` **и** `CURRICULUM` в FE `curriculum.js`; `module_step_count` у всех битов периода; `period1_guidance_complete` (хардкод P1-id); якорь в `BEAT_TO_ANCHOR` (`guidanceAnchors.js`) + `data-onboarding-anchor` на экране |
| Новый gate | `GateKind` + ветка в `_gate_satisfied`; авто-закрытие идёт через `_sync_auto_gates` |
| Новый триггер | `TRIGGERS` (уникальный `order`); экранный — `screen` + `GUIDANCE_SCREEN_TRIGGERS` в FE + вызов `reportGuidanceScreen` в `GameScreen.jsx`; неэкранный — ветка в `_trigger_eligible` (иначе он никогда не станет активным) |
| Новый PATCH-action | ветка в `patch_guidance` + вызов в `GameGuidanceLayer.jsx` / `GameScreen.jsx` |
| Новый nudge | `_build_nudge_block` + стрик на `GameProfile` (модель + миграция → skill `db-baselines-and-migrations`) + обновление в `update_nudge_streaks_on_period_close` |
| Поле в overview | `GuidanceOverview` в `schemas.py` + оба пустых/payload-словаря в `engine.py` |

### 4. Verify

```bash
cd backend && python -m pytest -q -k "guidance or onboarding"
cd backend && python -m pytest -q tests/test_events_unlock_intro.py tests/test_period_close_current_burn.py tests/test_admin_onboarding_ops.py
cd frontend-react && node --test src/guidance/curriculum.test.js src/guidance/guidanceStripLayout.test.js src/guidance/sessionDismiss.test.js src/guidance/guidanceAnchors.test.js
```

На Windows без `python` в PATH — `py -3 -m pytest …`. FE-тесты `src/guidance/*.test.js` **не входят** в `npm run test:unit` — запускай вручную.

## Инварианты (не ломать без spec)

- Прогресс guidance — **на `User`**, не на профиле; `onboarding_state/step` — на `GameProfile` и выставляются из guidance только в `complete_guidance`.
- Бэкенд `curriculum.py`/`triggers.py` и FE `curriculum.js` — **зеркала**: id, порядок, gate, `MIN_PERIOD_INDEX_FOR_GAME_EVENTS` (= 3 в `game/rules.py`).
- `_load_progress` отбрасывает неизвестные id: переименование бита «обнуляет» его у живых игроков — нужен маппинг как `O2_BEAT_TO_TRIGGER`.
- Хуки guidance не должны валить `process_period_end` / выбор события (обёрнуты в try/except).
- Guidance-ответ ≠ правило игры: экономика и victory не зависят от guidance (только UI-блокировки в FE `curriculum.js`).

## Ловушки (найдено в коде)

- **GET с побочными эффектами:** `build_guidance_overview` (в т.ч. из `GET /api/finance/overview`) делает `db.commit()` в `_sync_auto_gates` и может вызвать `complete_guidance` → commit + ops-алерт. Не вызывай его внутри чужой незакоммиченной транзакции.
- **Двойной commit при выборе события:** `on_event_chosen` → `patch_guidance` коммитит сам; ошибки глушатся `except Exception: pass` без лога.
- **`events_chosen_p2`** растёт на любом периоде; триггер-gate `action_event` считает `selected` события **любого** периода, а beat-gate — только `period_index == 2`.
- **Spec vs код:** в spec `t_events_intro` — «period ≥ 2», в коде — `MIN_PERIOD_INDEX_FOR_GAME_EVENTS` (3); spec ограничивает scope шаблоном «Студент», движок показывает curriculum на любом шаблоне (шаблон влияет только на порог nudge, `STUDENT_TEMPLATE_KEY`).
- **Лексикон:** главное действие — только «Завершить ход» (решение PO 2026-10-14, ADR-014); «Закрыть месяц» не использовать.
- `_nudge_threshold(profile, kind)` игнорирует `kind`: порог один на оба nudge — 1 (студент) / 2 (остальные).
- Хук закрытия периода — без savepoint (в отличие от достижений): DB-ошибка внутри него оставит сессию `process_period_end` в failed-состоянии, try/except этого не лечит.
- Неизвестный `action` в PATCH не даёт 4xx — молча sync + 200; `ValueError` (только «user not found») → 404.
- Actions `p1_close_debrief`, `complete_beat`, `event_chosen` FE не шлёт — их вызывают серверные хуки/тесты.
- FE `handleCurriculumDismiss`: `patch()` уже делает `refreshOverview`, затем handler зовёт его ещё раз (двойной запрос).
- **Сломанный FE-тест:** `guidanceAnchors.test.js` ждёт O2-id (`p2_events_intro`, `p3_needs`) — сейчас 1 fail; не в npm-скриптах, поэтому незаметен.
- `guidance_mode: "o2"` и воронка в админке считают только spine-биты, триггеры O3 в воронку не попадают.

## Итог (Verdict)

Завершай **PASS** / **CONCERNS** / **FAIL**: pytest `-k "guidance or onboarding"` зелёный, FE `node --test src/guidance/...` (с известным fail `guidanceAnchors` — указать отдельно), зеркало BE↔FE сверено, spec обновлён.

## Согласование изменений

Перед правкой текстов битов, gate или схемы `GuidanceOverview`: **Могу записать эти изменения?** Смена id бита/триггера — отдельно подтвердить план миграции прогресса.

## Следующий шаг

- [`test-driven-development`](../test-driven-development/SKILL.md) — если сценарий gate ещё не покрыт
- [`frontend-ui-engineering`](../frontend-ui-engineering/SKILL.md) — strip, якоря, MQX
- [`code-review-and-quality`](../code-review-and-quality/SKILL.md) — перед merge
- `admin-ops` — если меняется воронка/алерты онбординга в Watchtower
