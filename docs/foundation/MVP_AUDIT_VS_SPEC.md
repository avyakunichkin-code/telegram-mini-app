# Аудит: текущая реализация vs foundation (SPEC_PRODUCT §1–11)

Цель — **перед началом эпика Game-шаблон / `save_kind`** убедиться, что описанный в [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md) уже реализованный MVP **не расходится** с кодом. Расхождения ниже — либо баги/долг документации, либо намеренный технический долг (тогда ссылка на эпик).

**Дата проверки:** 2026-05-16 · **G1:** 2026-05-17 · **V2 + снятие XP:** 2026-05-25 · **M11 приёмка (doc):** 2026-05-26 · **Docs↔prod sync:** 2026-05-25 (Victory chain, mechanics_unlock, ADR-004).

**Подпись чеклиста:** 2026-05-16 — владелец продукта подтвердил соответствие («ок по чеклисту»). Задачи эпика G1 занесены в [`backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) (MQ-101–108).

## Как пользоваться

- Столбец **Статус:** `OK` — поведение соответствует foundation; `GAP` — есть отличие; `DEFER` — известный долг под эпик G1 / MVP 2.0.
- После правок кода или спеки обновляйте строки и дату в шапке.

| Тема (foundation) | Где в коде | Статус | Комментарий |
|---------------------|------------|--------|-------------|
| Период, play/pause, anchor | `backend/app/game_time.py` | OK | — |
| Конец периода: активы → долги → страховки → инвестиции → поражение 3× минус cash → снимок → события (без character XP) | `backend/app/game_period.py` | OK | XP/level сняты 2026-05-24 |
| Зарплата по кнопке, пропуск периода | `period_actions`, `game_period` | OK | Детали в SPEC_PRODUCT §3.2 |
| Победа v2: `chain` tutorial / legacy `parallel` | `victory_engine.py`, `victory_seeds.py`, overview | OK | Legacy `evaluate_mvp_victory` (AND MVP) — только тесты |
| `mechanics_unlock` по целям (жёсткие шаблоны) | `starter_mechanics.py`, `0037_*` | OK | [ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md) |
| До трёх событий на период, выбор с эффектами | `backend/app/routers/events.py`, `ensure_period_events` | OK | Фильтр `EventDefinition.mode` в семантике **`game` / `plan` / `any`** и **`profile.save_kind`** ([ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md)) |
| **M11:** tier-окно, `repeat_policy`, `cooldown_periods` | `game_rules.py`, `events.py`, миграция `0007` | OK | Приёмка **MQ-116**: `backend/tests/test_mq116_acceptance.py`, `test_ensure_period_events.py`; spec [SPEC_mvp-11](../specs/features/SPEC_mvp-11-progression-events.md) **approved** |
| Инвестиции / страховки | `routers/invest.py`, `insurance.py` | OK | На уровне MVP; расширения — backlog |
| Создание профиля **`save_kind` + шаблон Game** | `backend/app/routers/game.py`, `models.GameProfile` | OK | Legacy **`light` / `hardcore`** сняты ([ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md)) |
| UI: поток новой игры без legacy сложности | `frontend-react` (`NewProfileKindScreen`, `GameTemplatePickScreen`) | OK | **`DifficultyScreen`** удалён |
| Агрегированные «жизненные» расходы из шаблона + дельты событий | `base_monthly_lifestyle_expense` + дельты | PARTIAL | Полная модель статей — E1 draft |
| Победа M из N, `avg_net_cashflow_6p` в целях | `victory_engine.py`, overview `victory`, `MqxGoalDash` | OK | P1 UI целей ✅; баланс/плейтест — backlog |

## MVP 1.1 (M11) — приёмка документации

Синхронизация с кодом и [`SPEC_mvp-11-progression-events.md`](../specs/features/SPEC_mvp-11-progression-events.md) (Task **0.1**, [`PLAN_backlog_may2026.md`](../plans/PLAN_backlog_may2026.md)).

| Критерий MQ-116 | Проверка | Статус |
|-----------------|----------|--------|
| Каталог MVP 1.1 в БД (`event_tier`, `repeat_policy`, `cooldown_periods`) | `test_mq116_acceptance.py` → `TestMvp11CatalogContract` | OK |
| `ensure_period_events`: окно tier, cooldown, repeat | `test_ensure_period_events.py`, `TestEnsurePeriodEventsAcceptance` | OK |
| Без assert character level/XP в приёмке | SPEC + [remove-character-xp](../vision/ideas/remove-character-xp-and-levels.md) | OK |
| `GAME.md` §0.2 отражает cooldown/M11 | §0.2, §7.8 | OK (2026-05-26) |

**Не входит в MQ-116:** плейтест Pre-Alpha 10–20 игроков — [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](PRE_ALPHA_PLAYTEST_PROTOCOL.md), Task **0.3**.

**Проверка:** `pytest -q backend/tests/test_mq116_acceptance.py backend/tests/test_ensure_period_events.py`

---

## Вывод для бэклога

1. **Текущий MVP в целом согласован** с foundation по циклу периода, финансам, инвестициям, страховкам и правилу победы §1–11.
2. **M11 (события tier/cooldown)** — **приёмка doc + pytest закрыта** 2026-05-26; продуктовый плейтест α — отдельно.
3. **Victory v2** — backend + UI целей (`MqxGoalDash`); **DEFER**: Plan Mode; **E1** — повторная аналитика E1-R до миграций — см. [`TRACEABILITY.md`](../TRACEABILITY.md).
4. Эпик **MQ-101–108** закрыт в коде и бэклоге; активный план — [`PLAN_backlog_may2026.md`](../plans/PLAN_backlog_may2026.md).

## Связанные документы

- [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md)
- [`specs/features/SPEC_game-plan.md`](../specs/features/SPEC_game-plan.md)
- [`decisions/ADR-001-save-kind-remove-light-hardcore.md`](../decisions/ADR-001-save-kind-remove-light-hardcore.md)
