---
layer: spec
status: approved
owner: product
last_reviewed: 2026-06-01
tracks: ge1, pre-alpha, run-finale, player-feedback
idea: vision/ideas/game-run-finale-pre-alpha.md
design_lab: design-lab/run-finale/
related: specs/features/SPEC_victory-v2.md, foundation/SPEC_PRODUCT.md
not_in_scope: specs/features/SPEC_achievements.md
---

# Spec: Game Run Finale (GE1)

## Objective

**Why:** при `win_reached` или поражении игрок видит завершённую «историю партии» (игровые заслуги, не M12), может оставить комментарий; ops видит feedback в Watchtower.

**Success criteria (prod v1)**

- [x] Поражение: `is_active=0`, `is_archived=1`, `run_outcome=defeat`.
- [x] Победа: `run_outcome=victory` при первом `win_reached`; партия **остаётся активной** ([SPEC_victory-v2](SPEC_victory-v2.md) F1).
- [x] `GET /api/game/bootstrap` → `run_finale` при показе финала.
- [x] `POST /api/game/run-finale/dismiss` — скрыть финал победы (`victory_finale_shown_at`).
- [x] `POST /api/game/run-feedback` → `player_run_feedback`.
- [x] FE: `MqxRunFinale` (lab **V1 «Газета»**), бейджи в списке сохранений.
- [x] Admin Watchtower: таблица «Отзывы с финала».

---

## Показ финала

| Условие | `run_finale.outcome` | Повторный показ |
|---------|----------------------|-----------------|
| `game_session_status=defeated` | `defeat` | При каждом bootstrap defeated-сессии |
| `overview.win_reached` и `victory_finale_shown_at IS NULL` | `victory` | До dismiss |

После dismiss победы bootstrap **не** отдаёт `run_finale` (партия продолжается).

---

## Контракт `run_finale` (bootstrap)

Поле `GameBootstrapResponse.run_finale: RunFinalePayload | null`.

| Поле | Описание |
|------|----------|
| `outcome` | `victory` \| `defeat` |
| `period_index` | Период на момент финала |
| `template_key`, `template_title`, `persona_slug` | Сценарий / персонаж |
| `scenario_title`, `scenario_line` | Заголовок и подзаголовок по шаблону |
| `gazeta_lead` | Только победа — lead под маскотом |
| `coach_title`, `coach_text` | Копирайт Монетки (defeat bubble) |
| `sections[]` | Две группы метрик + `divider_before` |
| `sections[].metrics[]` | `glyph`, `headline`, `name`, `value` |
| `fact` | Только defeat: `title`, `text`, `tips[]` (UI label «Факт») |
| `defeat_reason` | `cash_negative_streak` \| `needs_depletion` \| … |
| `can_dismiss` | `true` только для победы |

Сборка: `backend/app/game/run_finale.py` → `build_run_finale_payload`.

### Игровые заслуги (метрики v1)

**Не** achievement chains (M12).

1. Периодов до исхода  
2. Средний доход / расход за период (из `PeriodEconomyClosing`, fallback — текущие ставки)  
3. Подушка в месяцах burn  
4. Сумма инвестиций (principal)  
5. Оценка активов, полисы, тело долга, пассивный поток  
6. Цели chain: `goals_met / goals_enabled`  
7. Просрочка на финале (если > 0)

Средний net cashflow **не** выводится на финале (решение UX V1).

---

## API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/game/bootstrap` | `run_finale` при необходимости |
| POST | `/api/game/run-finale/dismiss` | Победа: `victory_finale_shown_at=now()` |
| POST | `/api/game/run-feedback` | Тело: `{ "text": string, "outcome"?: "victory"\|"defeat" }` |

**Feedback:** `text` 2–2000 символов; `outcome` опционально (иначе из сессии / `win_reached`).

---

## Модель данных

### `game_profiles`

| Колонка | Тип | Назначение |
|---------|-----|------------|
| `run_outcome` | `VARCHAR(16) NULL` | `victory` \| `defeat` |
| `victory_finale_shown_at` | `TIMESTAMP NULL` | dismiss победного финала |

### `player_run_feedback`

| Колонка | Назначение |
|---------|------------|
| `user_id`, `game_profile_id` | Автор и партия |
| `outcome`, `template_key`, `period_index`, `defeat_reason` | Контекст |
| `comment` | Текст отзыва |
| `created_at` | Время |

Автомиграция: `main.py` (`ensure_schema_compatibility`); таблица — `Base.metadata.create_all`.

---

## Frontend

| Компонент | Путь |
|-----------|------|
| `MqxRunFinale` | `frontend-react/src/components/mqx/layout/MqxRunFinale.jsx` |
| Стили | `frontend-react/src/styles/mqx/run-finale.css` |
| Cup-ассеты | `frontend-react/src/assets/run-finale-cup/*-mascot-cup-dash.{webp,png}` |
| Хук | `useGame`: `runFinale`, `runFinaleOpen`, `dismissVictoryFinale`, `submitRunFeedback` |

CTA: победа — **Играть дальше** (dismiss) + **К сохранениям**; поражение — **Новая игра** + **К сохранениям**.

Список сохранений: подзаголовок `Победа` / `Поражение` · … (`run_outcome` / archived).

---

## Admin Watchtower

`GET /api/admin/watchtower` → `run_feedback[]` (последние N, default 50).

Колонки UI: когда, пользователь, профиль, исход, период, шаблон, комментарий (preview).

---

## Out of scope (v1)

- Звук, haptic, share-карточки  
- M12 achievements на финале  
- Обязательный комментарий  
- Комментарий с дашборда (backlog GE1-FB-2)  
- Lab-варианты S0/V7/V8 в prod (канон — **V1**)

---

## Тесты

- `backend/tests/test_run_finale.py` — архив defeat, bootstrap `run_finale`, feedback POST, resolve archived.

---

## Ссылки

- Idea: [`game-run-finale-pre-alpha.md`](../../vision/ideas/game-run-finale-pre-alpha.md)  
- Lab: [`design-lab/run-finale/`](../../../design-lab/run-finale/)  
- Эпик: [`PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) GE1
