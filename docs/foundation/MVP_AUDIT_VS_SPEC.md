# Аудит: текущая реализация vs foundation (SPEC_PRODUCT §1–11)

Цель — **перед началом эпика Game-шаблон / `save_kind`** убедиться, что описанный в [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md) уже реализованный MVP **не расходится** с кодом. Расхождения ниже — либо баги/долг документации, либо намеренный технический долг (тогда ссылка на эпик).

**Дата проверки:** 2026-05-16 · **Первичная проверка:** ревью кода в репозитории (агент).

**Подпись чеклиста:** 2026-05-16 — владелец продукта подтвердил соответствие («ок по чеклисту»). Задачи эпика G1 занесены в [`backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) (MQ-101–108).

## Как пользоваться

- Столбец **Статус:** `OK` — поведение соответствует foundation; `GAP` — есть отличие; `DEFER` — известный долг под эпик G1 / MVP 2.0.
- После правок кода или спеки обновляйте строки и дату в шапке.

| Тема (foundation) | Где в коде | Статус | Комментарий |
|---------------------|------------|--------|-------------|
| Период, play/pause, anchor | `backend/app/game_time.py` | OK | — |
| Конец периода: активы → долги → страховки → инвестиции → поражение 3× минус cash → XP → снимок → события | `backend/app/game_period.py` | OK | Порядок сверять с §3.3 при каждом изменении |
| Зарплата по кнопке, пропуск периода | `period_actions`, `game_period` | OK | Детали в SPEC_PRODUCT §3.2 |
| Победа MVP: подушка ≥ 3× обязательства, нет просрочки, поток ≥ 0; **`win_reached` только с `period_index >= 7`** | `backend/app/routers/finance.py` | OK | — |
| До трёх событий на период, выбор с эффектами | `backend/app/routers/events.py`, `ensure_period_events` | OK | Фильтр по `EventDefinition.mode` + `profile.mode` — **DEFER**: сменится на `save_kind` по ADR-001 |
| Инвестиции / страховки | `routers/invest.py`, `insurance.py` | OK | На уровне MVP; расширения — backlog |
| Создание профиля **`light` / `hardcore`** | `backend/app/routers/game.py`, `models.GameProfile.mode` | GAP | Против целевой концепции; исправление — эпик G1 + [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md) |
| UI: `DifficultyScreen` (legacy сложность) | `frontend-react` стартовый поток | GAP | Замена на Game-шаблон — G1 |
| Агрегированные «жизненные» расходы из шаблона + дельты событий | — | DEFER | Сейчас расходы моделируются активами/обязательствами/событиями; новая модель — в SPEC_game-plan |
| Победа M из N из шаблона, `avg_net_cashflow_6p` | — | DEFER | G1 / victory v2 |

## Вывод для бэклога

1. **Текущий MVP в целом согласован** с foundation по циклу периода, финансам, инвестициям, страховкам и правилу победы §1–11.
2. **Уже сейчас зафиксированный GAP:** legacy `mode` / `DifficultyScreen` и фильтр событий по `light`/`hardcore` — не «забытая концепция», а **запланированная замена** (ADR-001, SPEC_game-plan).
3. Чеклист подтверждён → см. очередь **MQ-101–108** в бэклоге и [`PLAN_game-plan`](../plans/PLAN_game-plan.md). При новом расхождении кода со строкой таблицы — сначала правка здесь, затем задача.

## Связанные документы

- [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md)
- [`specs/features/SPEC_game-plan.md`](../specs/features/SPEC_game-plan.md)
- [`decisions/ADR-001-save-kind-remove-light-hardcore.md`](../decisions/ADR-001-save-kind-remove-light-hardcore.md)
