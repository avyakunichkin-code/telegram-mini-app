---
layer: spec
status: approved
owner: product
last_reviewed: 2026-11-08
tracks: run-finale, player-feedback
design_lab: design-lab/run-finale/recap-round/
related: specs/features/SPEC_game-run-finale.md
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/approved
  - tvoy-hod/topic/run-finale
aliases:
  - "Run Finale Recap"
  - SPEC_run-finale-recap
  - "Spec: Разбор партии в финале"
---
# Spec: Разбор партии в финале

Расширяет [SPEC_game-run-finale](SPEC_game-run-finale.md). Макеты — раунд [recap-round](../../../../design-lab/run-finale/recap-round/README.md). **Владелец утвердил вариант Б «Лента решений» (09.11.2026);** контракт v1 содержит только решения, графика и серии по ходам нет.

## Assumptions

1. Раскладка — вариант Б; утверждён 09.11.2026.
2. Первая версия обходится без миграции: только существующие таблицы.
3. Партии, сыгранные до внедрения, тоже получают разбор: источники заполняются давно. Если данных мало — fallback.
4. «Поделиться итогом» — отдельная задача.

→ Проверить до реализации; см. Open questions.

## Objective

**Why:** сейчас финал показывает итоговые числа, но не историю. Игрок не видит, какие решения были самыми крупными.
**Who:** игрок на экране победы или поражения.
**Success criteria:**

- [ ] `run_finale.recap` приходит в bootstrap при показе финала и при победе, и при поражении.
- [ ] Каждое число разбора берётся из записей партии, а не из пересчёта по текущему каталогу событий.
- [ ] Формулировки разбора описывают факт и не утверждают причину исхода.
- [ ] При нехватке данных экран равен текущему финалу, без пустых блоков.
- [ ] Существующие поля `run_finale` не меняются.

## Scope

### In scope

- Поле `recap` в `RunFinalePayload`: до трёх самых крупных решений.
- Правило отбора решений и fallback.
- Показ в варианте Б.

### Out of scope

- Карточка «поделиться».
- Причинные выводы и оценки решений («ошибка», «лучший выбор»).
- Эффекты решений вне счёта: подушка, ежемесячные расходы, потребности, покупка активов (см. Open questions, 1).
- График денег по ходам (варианты А и В не выбраны).
- Изменение экономики и порогов победы.

## User flows

| Step | Actor | Result |
|------|-------|--------|
| 1 | Игрок завершает партию | Bootstrap отдаёт `run_finale` с `recap` |
| 2 | Экран финала | Показывает ленту решений и текущие блоки финала |
| 3 | Данных недостаточно | `recap = null`, экран как сейчас |
| 4 | Победа, «Играть дальше» | Dismiss как сейчас, разбор больше не показывается |

## Data & API

### Models / DB

Без изменений схемы.

| Что | Источник | Важно |
|-----|----------|-------|
| Решение | `event_instances` со `status=selected` + `event_choices.title` + `event_definitions.title` | Текущая партия по `game_profile_id` |
| Сумма решения | `transactions` с `type=event_cash`: `amount`, `period_index`, `description` | Настоящая сумма, применённая в партии |

Сумму **нельзя** брать из `event_choices.effects_json`: при выборе эффекты проходят через `resolve_choice_effects_for_definition`, а каталог мог измениться после партии.

Связи транзакции с `EventInstance` нет. Сопоставление: тот же `game_profile_id` и `period_index`, `description == "Событие: " + choice.title`. Если за ход совпало несколько решений или транзакций с одним текстом, такие решения в разбор не попадают: лучше пропустить, чем показать чужую сумму.

### Endpoints

Новых нет. `GET /api/game/bootstrap` → `run_finale.recap` (additive, nullable):

```json
{
  "decisions_label": "Самые крупные решения по счёту",
  "decisions": [
    {
      "period_index": 6,
      "event_title": "Сломался ноутбук",
      "choice_title": "Купить новый",
      "cash_delta": -45000
    }
  ]
}
```

| Поле | Правило |
|------|---------|
| `decisions[]` | 1–3 элемента, см. правило отбора; по возрастанию `period_index` |
| `cash_delta` | Со знаком, как в транзакции |

Sync: `backend/app/schemas.py` (`RunFinaleRecap`, `RunFinaleRecapDecision`), `build_run_finale_payload`, FE `MqxRunFinale`. Новый клиентский метод не нужен.

## UI / UX

- Раскладка — вариант Б раунда recap-round, утверждён 09.11.2026.
- Сумма дублируется знаком, а не только цветом. Деньги — через `MoneyText`.
- Проверка: 320 px, тёмная тема, поражение и победа.

## Rules & edge cases

**Отбор решений.** Кандидаты — решения с однозначно найденной транзакцией и ненулевой суммой. Сортировка: по убыванию `abs(cash_delta)`, затем по меньшему `period_index`, затем по `EventInstance.id`. Берутся первые три и показываются в порядке ходов.

**Фраза.** Подпись «Самые крупные решения по счёту» задаёт смысл отбора: это размер суммы, а не важность для исхода.

| Случай | Поведение |
|--------|-----------|
| Нет подходящих решений | `recap = null` |
| Поражение на закрытии хода | Решения партии показываются как при победе (CS-3) |
| Победа, партия продолжается | Разбор на момент показа; после dismiss не отдаётся |
| Истёкшее событие без выбора | Не решение, не попадает |
| Ошибка сборки разбора | Логируется, `recap = null`, финал показывается |

Нагрузка: запросы выполняются только при показе финала; партия — десятки строк.

## Testing strategy

| Layer | What to prove |
|-------|----------------|
| Unit | Отбор, сортировка, пропуск неоднозначных совпадений |
| API / integration | `recap` в bootstrap при победе и поражении; старые поля не изменились |
| FE contract | Экран без `recap` равен текущему финалу |
| Manual | 320 px, тёмная тема, обе развязки |

### Critical scenarios (min gate)

| ID | Scenario | Layer | Command / path |
|----|----------|-------|----------------|
| CS-1 | Победа: решения совпадают с записями партии | integration | `backend/tests/test_run_finale.py` |
| CS-2 | Сумма берётся из транзакции, даже если `effects_json` изменён после выбора | integration | `backend/tests/test_run_finale.py` |
| CS-3 | Поражение: `recap` приходит с решениями партии | integration | `backend/tests/test_run_finale.py` |
| CS-4 | Два решения с одинаковым текстом за ход не попадают в разбор | unit | `backend/tests/test_run_finale.py` |
| CS-5 | Нет подходящих решений: `recap = null`, финал работает | integration | `backend/tests/test_run_finale.py` |
| CS-6 | Без `recap` экран не содержит пустого блока | FE contract | `frontend-react`, `npm run test:unit` |

```bash
cd backend && py -3 -m pytest tests/test_run_finale.py -q
cd frontend-react && npm run test:unit && npm run build
```

## Boundaries

- **Always:** только факты партии; additive-поля; fallback на текущий финал.
- **Ask first:** миграции (в том числе `applied_effects_json`), новые зависимости, перенос макета в prod.
- **Never:** утверждать причину победы или поражения; пересчитывать суммы по текущему каталогу.

## Open questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Считать ли только разовые суммы? Решение «+5 000 ₽ расходов каждый ход» сейчас не попадёт в тройку. Полный учёт требует миграции: сохранять применённые эффекты в `event_instances` с момента внедрения | Владелец | Рекомендация: v1 только счёт, подпись это говорит |
| 2 | Какой вариант финала внедряем | Владелец | Б, утверждён 09.11.2026 |

## Traceability

| Artifact | Link |
|----------|------|
| Базовая спека | [SPEC_game-run-finale](SPEC_game-run-finale.md) |
| Макеты | `design-lab/run-finale/recap-round/` |
| Текущая сборка | `backend/app/game/run_finale.py` |
