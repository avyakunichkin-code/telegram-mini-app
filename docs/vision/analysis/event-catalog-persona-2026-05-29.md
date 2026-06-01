---
layer: analysis
status: snapshot
scope: persona
catalog: mvp11
date: 2026-05-29
verdict: GAPS
source: /event-analysis
---

# Event Catalog Analysis — scope: persona

## Executive summary

- Контракт каталога **в порядке**: 28 событий, `validate_mvp11_specs: ok`.
- Явная персонализация через `prerequisites` — **только 3 из 28** (2 student-leaning, 1 pro-leaning); остальное **общий пул** с одним копирайтом и суммами.
- **Студент** (`mq_game_basic_v1`, без машины): не видит `car_accident`; видит `friend_outing_student` и цепочку `used_car_offer` → `deadline`.
- **Профессионал** (старт с `car_personal`): **не видит** `friend_outing_student` и `used_car_offer` (forbid car); видит `car_accident`.
- Критичный пробел: **нет пары** `mq11_friend_outing_pro`; в `persona-profiles.md` есть пример `coffee_takeaway_student/pro`, в YAML — только общий `mq11_coffee_takeaway`.

## Контракт

| Метрика | Факт | Норма |
|---------|------|-------|
| Всего defs | 28 | ≥12 ✓ |
| validate | ok | pass ✓ |
| `audience_json` | нет в prod | фаза 2 |

## Матрица персон (как сейчас в prod)

| Класс | Механизм | keys | Кто реально видит |
|-------|----------|------|-------------------|
| **Student-leaning** | `forbid car` | `mq11_friend_outing_student`, `mq11_used_car_offer` (+ `deadline` по chain) | В основном **студент** (у про на старте уже машина — offer не выпадет) |
| **Pro-leaning** | `active car` | `mq11_car_accident` | **Профессионал** и студент, если купил авто по цепочке |
| **Debt-leaning** | `min_active_liabilities: 1` | `mq11_refinance_bank` (**inactive**) | Про с автокредитом; студент без долгов — нет |
| **Asset-leaning** | `home/house/mansion` | `mq11_home_water_damage` | Кто накопил жильё (редко у студента на старте) |
| **Universal** | без prereq | **23 активных** | Оба шаблона, **одинаковый текст и `cash_delta`** |

## Пары `_student` / `_pro`

| Механика | Student key | Pro key | Статус |
|----------|-------------|---------|--------|
| Прогулка с подругой | `mq11_friend_outing_student` | — | **P1 gap** |
| Кофе (пример в persona-profiles) | — (в доке есть пример) | — | **P1 gap** — в каталоге только `mq11_coffee_takeaway` (any) |
| Подержанное авто | `mq11_used_car_offer` | нет отдельного «уже есть авто» | ок для студента; у про на старте не релевантно |
| ДТП | — (до покупки авто) | `mq11_car_accident` | ок по prereq, но нет «лёгкой» студенческой версии ДТП |

**Итого пар в каталоге: 0 полных пар.** Есть только односторонние student-only / pro-only фильтры.

## Universal-события: одинаковые суммы, разный % зарплаты

Ориентиры: студент **62.5k**, про **100k** (persona-profiles).

| key | tier | max \|cash\| | % студент | % про | Заметка |
|-----|------|-------------|-----------|-------|---------|
| `mq11_gym_membership` | 1 | 14 900 | **23.8%** | 14.9% | для студента очень тяжёлый «годовой» выбор |
| `mq11_wedding_gift_once` | 2 | 22 000 | **35.2%** | 22.0% | разовое, но больнее для студента |
| `mq11_family_money_request` | 2 | 15 000 | 24.0% | 15.0% | универсальный копирайт «родственник» |
| `mq11_relocation_bonus` | 4 | 35 000 (бонус) | 56.0% | 35.0% | tier 4, но масштаб разный |
| `mq11_sprain_leg` | 2 | 24 000 | **38.4%** | 24.0% | mandatory health |
| `mq11_coffee_takeaway` | 1 | 3 200 | 5.1% | 3.2% | один текст для обоих — кандидат на пару |

Мягкие tier-1 (3–7% у обоих): groceries, transport, pharmacy, friend_outing — **баланс ближе к симметричному**.

## Rescue и social (студент по дизайну blueprint)

| key | rescue | needs | Примечание |
|-----|--------|-------|------------|
| `mq11_rescue_friend_call` | social | social+health | universal; у студента `rescue_event_bias` 1.2 в шаблоне |
| `mq11_rescue_easy_walk` | health, comfort | health+comfort | universal |

Пробелов по rescue мало; персонализация идёт через **bias в шаблоне**, не через отдельные keys.

## Цепочки и персоны

| chain | Старт | Student | Pro (старт с авто) |
|-------|-------|---------|---------------------|
| `used_car` | `mq11_used_car_offer` | ✓ | ✗ (forbid car) |
| `family_money` | `mq11_family_money_request` | ✓ | ✓ (один копирайт) |

## Gaps (рекомендации)

| P | Gap | Действие |
|---|-----|----------|
| **P1** | Нет `mq11_friend_outing_pro` | `/create-event` + brief: тот же shape, выше суммы, status/comfort, prereq `car_personal` или any |
| **P1** | Кофе / бытовые consumption — один key на всех | Пара `_student` / `_pro` или осознанно оставить any с пометкой в brief |
| **P2** | Tier-1 `gym_membership` 23.8% salary студента | Pro-версия с меньшим абонементом или снизить сумму в student-only key |
| **P2** | `wedding_gift` / `family_money` — универсальный тон | Pro: «коллега/свадьба в другом городе»; student: «друг/группа» — отдельные keys |
| **P3** | `persona-profiles.md` пример coffee pair не в каталоге | Синхронизировать док с YAML или добавить пару |
| **P3** | `audience_json` нет | architecture фаза 2; до тех пор — prereq + naming |

## Verdict: **GAPS**

Каталог **играбелен**, контракт соблюдён, но **персональный слой тонкий**: 3 явных фильтра и 23 общих события с одним масштабом денег. Для продукта «Студент vs Профессионал» не хватает **симметричных пар** в social/consumption и выравнивания «тяжёлых» сумм под 62.5k.

## Handoff

- **P1** → `/create-event` (`mq11_friend_outing_pro`, опционально coffee pair).
- После серии правок YAML → `economy-reviewer` + `pytest -k event`.
- Полный каталог → `/event-analysis scope: all`.

## Как воспроизвести

```bash
cd backend && python scripts/event_catalog_report.py
```
