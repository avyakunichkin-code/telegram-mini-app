---
layer: spec
status: implemented
owner: product
last_reviewed: 2026-11-11
tracks: ge1, pre-alpha, run-finale, player-feedback
idea: vision/ideas/game-run-finale-pre-alpha.md
design_lab: game/design-lab/run-finale/
related: specs/features/SPEC_victory-v2.md, foundation/SPEC_PRODUCT.md
not_in_scope: specs/features/SPEC_achievements.md
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/implemented
  - tvoy-hod/topic/ge1
  - tvoy-hod/topic/player-feedback
  - tvoy-hod/topic/pre-alpha
  - tvoy-hod/topic/run-finale
aliases:
  - "Game Run Finale (GE1)"
  - "SPEC game run finale"
  - SPEC_game-run-finale
  - "Spec: Game Run Finale (GE1)"
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
- [x] FE: `MqxRunFinale` (канон **BG-2**, блок решений **A · Чек**), бейджи в списке сохранений.
- [x] Admin Watchtower: таблица «Отзывы с финала».

**Расширение «Цена решений» (2026-11-11):** реализовано и проверено локально, DC-01…09. PO утвердил A для обоих исходов и предварительный порог 1× среднего регулярного дохода. Деплой этого расширения не выполнялся; `implemented` описывает состояние кода. Формулы и правила — [`SPEC_run-finale-decision-cost`](SPEC_run-finale-decision-cost.md), результаты — [`план DC`](../../plans/PLAN_run-finale-decision-cost.md).

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
| `turns_completed`, `cash_balance`, `cushion_turns` | Показатели победы BG-2: завершённые ходы, деньги на счёте, подушка |
| `monthly_burn` | Число или `null` (старый payload): база подписи «N мес. расходов»; не порог отбора |
| `decisions[]` | От 0 до 3 фактов: `kind`, `direction`, `title`, `detail`, положительный `amount`, необязательный `period_index`, `is_estimate` |

Сборка: `game/api/app/game/run_finale.py` → `build_run_finale_payload`.

### Дополнительные метрики payload (совместимость v1)

**Не** achievement chains (M12).

1. Периодов до исхода  
2. Средний доход / расход за период (из `PeriodEconomyClosing`, fallback — текущие ставки)  
3. Подушка в месяцах burn  
4. Сумма инвестиций (principal)  
5. Оценка активов, полисы, тело долга, пассивный поток  
6. Цели chain: `goals_met / goals_enabled`  
7. Просрочка на финале (если > 0)

Средний net cashflow **не** выводится на финале (решение UX V1).

### «Что решило партию» — DC-01…09

- Четыре типа кандидатов: переплата по каждому кредиту, пропущенные зарплаты одной оценкой, самое дорогое списание события, общий заработок на вкладах/облигациях.
- Порог — **1× среднего регулярного дохода за закрытые ходы**, включая оценку доступных пропущенных зарплат. Сумма ровно на пороге проходит. Без закрытых ходов список пуст; нулевой порог пропускает только положительные суммы.
- По убыванию суммы, до трёх строк и максимум двух кредитов. Прошедший порог `investment_gain` сохраняет место в списке по текущему правилу замены третьей строки. Вложения агрегированы в одну карточку; разделение на две строки не вводилось.
- Суммы собирает backend по журналу и связанным объектам. Записи без необходимой связи не восстанавливаются по описанию; оценки помечены `is_estimate`.
- UI A: на победе после показателей, на поражении после советов, перед кнопками. Нейтральный список, доступные знаки «−»/«+», «≈» для оценок, суммы через `MoneyText`. Пустой список скрывает блок.
- Подпись масштаба остаётся в месяцах расходов: `amount / monthly_burn`, скрывается при нуле/отсутствии базы. Порог и масштаб подписи используют разные базы по утверждённым решениям.
- Экономические проводки и правила победы/поражения расширением не меняются. Подробности, исключения и тестовые сценарии — в [`spec «Цена решений»`](SPEC_run-finale-decision-cost.md).

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

PostgreSQL: схема создаётся через `bash game/api/scripts/db.sh migrate`, startup только сверяет её. `Base.metadata.create_all` используется для одноразовых SQLite-тестов. Связи журнала с кредитом и событием — nullable FK `transactions.liability_id` и `transactions.event_instance_id`, миграции `0051` / `0052`, без backfill. См. [`migrations/README`](../../../api/migrations/README.md).

---

## Frontend

| Компонент | Путь |
|-----------|------|
| `MqxRunFinale` | `game/web/src/components/mqx/layout/MqxRunFinale.jsx` |
| Стили | `game/web/src/styles/mqx/run-finale.css` |
| Cup-ассеты | `game/web/src/assets/run-finale-cup/*-mascot-cup-dash.{webp,png}` |
| Хук | `useGame`: `runFinale`, `runFinaleOpen`, `dismissVictoryFinale`, `submitRunFeedback` |

CTA: победа — **Играть дальше** (dismiss) + **Новая игра**; поражение — **Новая игра** + **К сохранениям**. Необязательный отзыв расположен ниже кнопок.

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
- Исторические Lab-варианты S0/V7/V8 и V1 «Газета» (текущий канон — **BG-2 + A · Чек**)

---

## Тесты

- `game/api/tests/test_run_finale.py` — архив defeat, bootstrap `run_finale`, feedback POST, resolve archived.
- `game/api/tests/test_run_finale_decisions.py` — формулы, связи, границы порога 1×, оценка зарплат, отбор.
- `game/web/src/components/mqx/layout/__tests__/runFinaleDisplay.test.js` и `game/web/e2e/run-finale.spec.js` — пустой/оценочный блок, оба исхода, 320/390 px и desktop, light/dark.
- [`DC-09`](../../plans/PLAN_run-finale-decision-cost.md) — свод проверок, отдельный PostgreSQL migrate/repeat и review. Это локальная проверка, не свидетельство deploy.

---

## Ссылки

- Idea: [`game-run-finale-pre-alpha.md`](../../vision/ideas/game-run-finale-pre-alpha.md)  
- Lab: [`game/design-lab/run-finale/`](../../../design-lab/run-finale)  
- Эпик: [`PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) GE1
