---
layer: plan
epic_id: NV
phase: define
status: draft
tracks: needs, events, economy, balance
spec: ../specs/features/SPEC_needs-set-point.md
adr: ../decisions/ADR-015-needs-set-point-model.md
idea: ../vision/ideas/needs-value-curve.md
next_skill: incremental-implementation
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/draft
  - tvoy-hod/topic/economy
aliases:
  - "План NV: износ потребностей, уровень жизни и цена балла"
  - NV
  - PLAN_needs-set-point
---
# План NV: износ потребностей, уровень жизни и цена балла

Нарезка под [SPEC_needs-set-point](../specs/features/SPEC_needs-set-point.md). Пять шагов из [idea](../vision/ideas/needs-value-curve.md); каждый — отдельный PR с зелёными проверками.

## 1. Граф зависимостей

```mermaid
flowchart TD
  S1[Шаг 1: кривая + коридор в линтере]
  S2[Шаг 2: purpose, effect_tags, линтер знаков]
  S3[Шаг 3: расчёт L + overview]
  S4[Шаг 4: износ + уровень в закрытии периода]
  S5[Шаг 5: cash_pct_salary + перекалибровка каталога]
  UI[design-lab: маркер L на шкале]

  S1 --> S2
  S1 --> S3
  S3 --> S4
  S2 --> S5
  S4 --> S5
  S3 --> UI
```

Шаги 1 и 3 независимы и могут идти параллельно (разные файлы). Шаг 5 — последним: числа каталога калибруются под уже работающую модель.

## 2. Шаги и задачи

### Шаг 1 — Кривая цены и коридор (только отчёт)

Primary: **game-economy-and-victory** · satellite: test-driven-development

| ID | Задача | Файлы | DoD |
|----|--------|-------|-----|
| NV-101 | `needs_points(cost, salary, *, k=25, alpha=0.3)` | `backend/app/needs/value_curve.py` (новый) | CS-7 зелёный |
| NV-102 | Коридор ±50% для выборов с `needs+` и ценой; warnings, не errors | `backend/app/events/balance_contract.py` | отчёт со списком выбросов; baseline violations = 0 не меняется |
| NV-103 | MCE §12: месячный платёж за горизонт, ссылка на кривую | `.claude/skills/create-event/event-balance-rules.md` §6, §12 | правила согласованы с кодом |

Проверка: `cd backend && py -3 -m pytest -q`.

### Шаг 2 — Назначение траты и механизмы

Primary: **create-event** · satellites: event-analysis, test-driven-development

| ID | Задача | Файлы | DoD |
|----|--------|-------|-----|
| NV-201 | Справочник механизмов `tag → plus/minus` | `data/events/mvp11/meta/needs_effect_map.yaml` | ≥ 9 механизмов из idea |
| NV-202 | Загрузка `purpose`, `effect_tags` в catalog/contract | `backend/app/events/mvp11_catalog.py`, `mvp11_contract.py` | неизвестный tag/purpose → ошибка |
| NV-203 | Линтер знаков: ось с плюсом без механизма → нарушение; коридор кривой только для `pleasure` | `balance_contract.py` | CS-8 |
| NV-204 | Разметка 174 выборов mvp11 | `data/events/mvp11/*.yaml`, `chains/` | 0 нарушений; спорные выборы — в отчёт PO |
| NV-205 | Проверка `event_domain` против `VALID_EVENT_DOMAINS` (4 битых ключа из аудита) | `taxonomy.py`, YAML | contract ловит неизвестный домен |
| NV-206 | §11 правил → ссылка на справочник механизмов | `event-balance-rules.md` | |

Проверка: `py -3 -m pytest -q -k "mvp11 or balance"`, `/event-analysis`.

### Шаг 3 — Уровень жизни L (только чтение)

Primary: **game-economy-and-victory** · satellites: api-and-interface-design, test-driven-development

| ID | Задача | Файлы | DoD |
|----|--------|-------|-----|
| NV-301 | Парсинг `needs.model` и `needs.set_point` с дефолтами spec | `backend/app/needs/engine.py` (`parse_needs_config`) | старые конфиги без изменений |
| NV-302 | `derive_wear(cfg)` из `passive_periods_to_zero`; `bonus_cap` по оси; проверка инварианта давления | `backend/app/needs/set_point.py` (новый) | CS-5 на всех сидах |
| NV-303 | `compute_level(db, profile, cfg) → LevelResult(level, sources)`: бюджет относительно нормы, привыкание, активы, стрессоры, потолок | `backend/app/needs/set_point.py` | CS-2, CS-3 (unit на чистых входах) |
| NV-304 | Период покупки актива для привыкания: проверить наличие поля, иначе миграция (**ask first**) | `models.py`, `backend/migrations/` | возраст актива доступен |
| NV-305 | Overview: `needs_meta.model`, `level`, `wear`, `level_sources`, `periods_to_zero_if_idle` | `backend/app/finance/overview_build.py`, `schemas.py` | CS-9 |
| NV-306 | FE-зеркало: чтение полей без UI | `frontend-react/src/api/finance.js` | `npm run build`, `test:unit` |
| NV-307 | README карты API | `backend/app/README.md` | |

Проверка: pytest; `economy-reviewer` по диффу.

### Шаг 4 — Износ + уровень жизни в закрытии периода

Primary: **game-economy-and-victory** · satellites: critical-test-scenarios, doubt-driven-development, balance-playtest

| ID | Задача | Файлы | DoD |
|----|--------|-------|-----|
| NV-401 | `apply_wear_and_level(cfg, before, level, wear) → NeedsDecayResult`: `N + r(L − N) − w`, порог нуля | `backend/app/needs/engine.py` | unit |
| NV-402 | Ветка в `_apply_needs_decay` по `needs.model`; порядок шагов закрытия по spec | `backend/app/game/period.py` | CS-1, CS-3, CS-4; CS-6 (linear не изменился) |
| NV-403 | Всплески: множитель «запас до 100» в `choose` и treat-self только при `set_point` | `services/events/choose.py`, `services/period/treat_self.py` | unit |
| NV-404 | Ответ `time/next`: `model`, `level`, `wear`, `after` | `game/period.py`, `schemas.py`, `src/api/game.js` | контракт |
| NV-405 | Бот-стратегии: пассивный, аскет, пассивный с просрочкой, активный 2 × 2/4/7% зарплаты, активный + подписки/авто (перенос скрипта симуляции из spec §5, с `bonus_cap`) | `backend/scripts/balance_playtest.py` | сценарии в отчёте |
| NV-406 | Перевод Студента на `set_point`, прогон 30–40 периодов, калибровка K_imp / T / r / K_L / стрессоров | seeds, `docs/balance/reports/` | пассивный → поражение на T ± 2; аскет и долг — раньше; активный 2 × 4% жив 40 периодов с уровнем 35–50 (CS-10) |
| NV-407 | Перевод остальных трёх шаблонов | seeds | balance diff без регрессий |
| NV-408 | Справка «Почему снижаются» | `backend/app/needs/guide_content.py` | рутина изнашивает, уровень жизни смягчает, события восполняют |
| NV-409 | ADR-015 → accepted, обновить SPEC_game-character-needs и ADR-005 (ссылка «§3 заменён ADR-015») | docs | |

Проверка: pytest, `/balance-playtest`, `economy-reviewer`, `/code-review`.

### Шаг 5 — Суммы в % зарплаты и перекалибровка каталога

Primary: **create-event** · satellites: event-analysis, balance-playtest

| ID | Задача | Файлы | DoD |
|----|--------|-------|-----|
| NV-501 | `cash_pct_salary` в effects: расчёт в choose и impacts | `services/events/choose.py`, `events/choice_impacts.py`, contract | unit + impacts в payload |
| NV-502 | Перевод soft_offer/universal выборов на `cash_pct_salary`; удаление дублей-скинов (`coffee_*`, `phone_*`), если покрываются % | YAML | персоны Руководитель/Предприниматель видят те же события |
| NV-503 | Перекалибровка `needs_delta` `pleasure`-выборов под кривую (потолок 10 на ось) | YAML | коридор: 0 warnings |
| NV-504 | `mitigation`-выборы: минус отказа > минуса оплаты, без плюсов | YAML | линтер |
| NV-505 | Лимиты повторов: `streaming_offer`, `lifestyle_creep` → `max_per_profile`; cooldown у `home_water_damage`, `car_accident` | YAML | аудит §10 чистый |
| NV-506 | Финальный `/balance-playtest` и baseline | `docs/balance/baselines/` | обновлённый baseline |

## 3. Контрольные точки

| После | Что показать PO |
|---|---|
| Шаг 2 | список спорных выборов из разметки (механизм не совпал с осями) |
| Шаг 3 | L, износ и «обнулится через N мес. без событий» для 4 персон (overview) |
| NV-406 | отчёт playtest Студента: период поражения пассивного/аскета/должника, уровень активного |
| Шаг 5 | diff баланса до/после, таблица ₽/балл по каталогу |

## 4. Риски

| Риск | Митигация |
|---|---|
| Активному игроку слишком тяжело (уровень < 30 при разумных тратах) | K_imp и T в NV-406; цель 35–50 |
| Пассивная игра без поражения из-за неверного конфига | инвариант давления в тесте на все сиды (CS-5) |
| Оси с низким стартом почти не «покупаются» уровнем жизни (`bonus_cap` 4 у social Предпринимателя) | проверить ощутимость в NV-406; при необходимости поднять base |
| Двойной учёт машины (актив + transport) | transport — расходы на езду, актив — владение; проверить в NV-406 |
| Каталог в смешанном состоянии между шагами 4 и 5 | шаг 4 переводит шаблоны только после NV-406; шаг 5 сразу следом |
