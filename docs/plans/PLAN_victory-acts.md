---
layer: plan
epic_id: PR-21
phase: define
status: draft
owner: product
last_reviewed: 2026-11-02
spec: ../specs/features/SPEC_victory-acts.md
idea: ../balance/INV-1_2026-11-01.md
related:
  - ../plans/PLAN_production-ready.md
  - ../specs/features/SPEC_victory-v2.md
  - ../specs/features/SPEC_game-run-finale.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/draft
aliases:
  - PLAN_victory-acts
  - "Plan: победа в два акта"
---
# Plan: победа в два акта (PR-18 → PR-21, вариант C)

**Эпик:** PR-18 (spec + sim) → PR-21 (внедрение) в [`PLAN_production-ready`](PLAN_production-ready.md).  
**Spec:** [`SPEC_victory-acts.md`](../specs/features/SPEC_victory-acts.md) — **DRAFT**. Спека и калибровка A приходят с PR #16 (`feat/victory-calibration-a`). До merge PR #16 ссылка на спеку в `main` не открывается.  
**Статус плана:** DRAFT, только план. **Код не начинать**, пока PO не скажет APPROVED по спеке и этому плану (решение PO 2026-11-01: «C как цель, временно A»).  
**После утверждения:** `incremental-implementation` по задачам ниже; экономические срезы ведёт primary `game-economy-and-victory`.

## Summary

Цепочка победы после калибровки A становится **актом 1** без изменений в балансе. **Акт 2** — долгая цель «финансовая независимость» со своим финалом в окне P25–P40. Работа идёт снизу вверх с проверкой рисков в начале:

1. Сначала симуляция: можно ли вообще дойти до акта 2 за 40 ходов (MQ-ACT-01).
2. Затем контракт данных.
3. Затем движок и хранение.
4. Затем overview, bootstrap и финал.
5. Затем инварианты баланса.
6. UI — только после ★ раунда в design-lab, e2e — последним.

Конфиг без `acts` на каждом шаге ведёт себя как сейчас (CS-1). Поэтому шаблоны можно переводить по одному, а каждый срез можно выкатывать отдельно.

## Dependency graph

```text
MQ-ACT-01 sim: политика act2_runner + метрика pi/burn ──► Open question 1 (порог, PO)
MQ-ACT-02 контракт: victory_config_json.acts + overview/bootstrap поля + хранение ходов актов (OQ3)
  ├── MQ-ACT-03 движок: акты, текущий акт, гейт акта 2        (CS-1, CS-3)
  │     ├── MQ-ACT-04 тип цели passive_income_share_min + lint
  │     │     └── MQ-ACT-06 сиды: acts в 4 шаблонах (после OQ1)
  │     └── MQ-ACT-05 victory_goals.act_key: миграция + sync   (CS-6)
  ├── MQ-ACT-07 профиль: ходы актов, «не два финала за ход»    (CS-4, CS-5)
  │     └── MQ-ACT-08 overview + bootstrap + run_finale после каждого акта (CS-2)
  │           └── MQ-ACT-11 FE: api + MqxGoalDash + финал акта 1   ◄── MQ-ACT-10 lab ★ (APPROVED)
  │                 └── MQ-ACT-12 e2e CS-8
  └── MQ-ACT-09 баланс: INV-4 (акт 1) + INV-1 (акт 2) в balance_diff, эталоны (CS-7)
MQ-ACT-13 docs: SPEC → implemented, victory-v2, run-finale, THRESHOLDS, CHANGELOG
```

## Vertical slices

| # | Срез | Phase | Tier | Skill | Satellites | Read if (`when`) | Next skill |
|---|------|-------|------|-------|------------|------------------|------------|
| 1 | Достижимость акта 2 в симуляции (MQ-ACT-01) | `define` | `core` | `balance-playtest` | `game-economy-and-victory` | — | решение PO по OQ1 |
| 2 | Контракт конфига, API и хранения (MQ-ACT-02) | `define` | `core` | `api-and-interface-design` | `test-driven-development` | `breaking API change` — нет, всё аддитивно | `game-economy-and-victory` |
| 3 | Движок + тип цели + сиды (MQ-ACT-03, 04, 06) | `build` | `core` | `game-economy-and-victory` | `test-driven-development`, `doubt-driven-development`, `critical-test-scenarios` | victory / `victory_config_json` | `critical-test-scenarios` |
| 4 | `victory_goals.act_key` (MQ-ACT-05) | `build` | `core` | `db-baselines-and-migrations` | `test-driven-development` | `00NN_*.sql`, seeds | `game-economy-and-victory` |
| 5 | Профиль, финал, overview/bootstrap (MQ-ACT-07, 08) | `build` | `core` | `game-economy-and-victory` | `api-and-interface-design`, `critical-test-scenarios` | run_finale | `critical-test-scenarios` |
| 6 | Инварианты баланса и эталоны (MQ-ACT-09) | `verify` | `core` | `balance-playtest` | `economy-reviewer` (субагент) | — | `code-review-and-quality` |
| 7 | Lab «Цель · Акт N из 2» + финал акта 1 (MQ-ACT-10) | `define` | `core` | `design-lab-mqx` | — | lab parity / canon | `frontend-ui-engineering` |
| 8 | FE prod + e2e (MQ-ACT-11, 12) | `build` | `core` | `frontend-ui-engineering` | `critical-test-scenarios`, `mqx-ui-reviewer` | — | `code-review-and-quality` |

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Цель акта 2 недостижима за 40 ходов у части шаблонов: по оценке ниже у предпринимателя (`debt_stack`) — недостижима при любом пороге | MQ-ACT-01 идёт первым. Порог задаётся в конфиге каждого шаблона, а не одним числом на все. Для предпринимателя есть вариант «погашение долга как шаг акта 2» (OQ1-b) |
| `chain_runner` после победы перестаёт вкладывать, поэтому эталоны не показывают ход акта 2 | Новая политика `act2_runner` в `balance_simulate.py`: после акта 1 вкладывает свободный поток. INV-1 считается по ней |
| Два финала за один ход (акт 1 и цель акта 2 выполнены одновременно) | Гейт в движке: акт 2 считается выполненным только при `period_index > act1_at_period` (CS-4). Нужен сохранённый ход акта 1 (OQ3) |
| Старые партии без `acts` на старте получают акты на лету | Конфиг читается из шаблона при каждом `evaluate_victory`, как сейчас. Если `run_outcome=victory` уже стоит, акт 1 считается пройденным, а ход акта 1 = `NULL` (без гейта CS-4) |
| `win_reached` начинает означать «акт 2», и старый FE ломается | `win_reached` остаётся флагом акта 1 (spec, контракт). Новый смысл несут только новые поля |
| `mechanics_unlock` (ADR-004) начинает зависеть от шагов акта 2 | Unlock-шаги считаются только по ключам акта 1. Unit-тест на это — в MQ-ACT-03 |
| Сдвиг баланса акта 1 из-за рефакторинга движка | Эталоны `chain_runner` по акту 1 должны совпасть побайтно по `win_at_period` (P15/P14/P14/P17); `balance_diff` до и после |

## Checkpoints

- [ ] PO: Open question 1 (цель и порог акта 2) — после MQ-ACT-01
- [ ] PO: Open question 3 (где хранить ходы актов) — до MQ-ACT-07
- [ ] Spec **APPROVED** (сейчас DRAFT, лежит в PR #16)
- [ ] Строка в `TRACEABILITY.md` (колонка Plan) — после merge PR #16 и APPROVED
- [ ] **Checkpoint A** (после MQ-ACT-02…06): `py -3 -m pytest -q` зелёный; CS-1, CS-3, CS-6 зелёные; `balance_diff` по акту 1 без изменений
- [ ] **Checkpoint B** (после MQ-ACT-07…09): CS-2, CS-4, CS-5, CS-7 зелёные; INV-4 и INV-1 (акт 2) проходят на 4 шаблонах; `economy-reviewer` без NEEDS REVISION; эталоны обновлены с согласия PO
- [ ] **Checkpoint C** (после MQ-ACT-10…12): раунд lab APPROVED; `npm run test:unit && npm run build && npm run check:guardrails && npm run test:e2e` зелёные; CS-8 на mobile и desktop
- [ ] Spec → `implemented`; PR-18/PR-21 в `PLAN_production-ready` → ✅

## Open question 1 — цель и порог акта 2 (решает PO)

**По умолчанию (рекомендация спеки):** финансовая независимость. Пассивный доход за ход ≥ X% от расходов на жизнь (`lifestyle_burn`). Обязательные платежи по долгам (`structural_obligations`) в знаменатель не входят: иначе цель смешивается с погашением долга и на ипотечном шаблоне недостижима (см. таблицу).

**Расчёт по эталонам.** Источник: `docs/balance/baselines/main__*_chain_runner_40p.json` из PR #16, калибровка A, seed 42. Что видно в эталонах:

- доходность вложений одинакова на всех шаблонах — ≈ **1,33% от вложенного за ход**;
- после победы `chain_runner` перестаёт вкладывать: `invested` замирает, а `cash` растёт.

Модель оценки: с хода победы весь свободный поток (средний прирост `cash` за ходы win+3…win+15, события уже внутри) уходит во вложения, новый пассивный доход тоже вкладывается. Это грубая детерминированная оценка: без разброса событий и без роста зарплаты. MQ-ACT-01 заменит её настоящей симуляцией.

| Шаблон | Акт 1 (ход) | Свободный поток / ход | Пассив / расходы на жизнь на финише акта 1 | Пассив / все траты | X = 25% | X = 50% | X = 100% | +15 п. п. от старта акта 2 | +25 п. п. |
|---|---|---|---|---|---|---|---|---|---|
| Студент (`basic`) | P15 | ≈ 18 тыс. | 7% | 7% | P47 | > P60 | > P60 | P42 | P55 |
| Профи (`tight_budget`) | P14 | ≈ 32 тыс. | 21% | 11% | P18 | P38 | > P60 | **P25** | **P33** |
| Руководитель (`mortgage_stress`) | P14 | ≈ 47 тыс. | 69% | 28% | уже | уже | P40 | **P25** | **P31** |
| Предприниматель (`debt_stack`) | P17 | ≈ 6 тыс. | 24% | 13% | > P60 | > P60 | > P60 | > P60 | > P60 |

В таблице «P47» означает ход, на котором порог достигается; **жирным** — попадание в окно P25–P40. Если знаменатель — все траты (с долгами), то даже X = 50% достигается только у профи (P59) и руководителя (P47), то есть позже P40.

**Что из этого следует:**

1. **Одного X на все шаблоны нет.** Абсолютный порог даёт либо «уже выполнено» (руководитель при X ≤ 75%), либо «недостижимо» (студент, предприниматель).
2. **Относительный порог** «+N п. п. от уровня на старте акта 2» выравнивает шаблоны. При N = 15–25 п. п. профи и руководитель укладываются в P25–P33. Студенту не хватает темпа (P42 при +15).
3. **Предприниматель** не дойдёт без отдельного шага: свободный поток ≈ 6 тыс./ход, деньги съедают долги и рост расходов к P35.

**Варианты для PO:**

| Вариант | Как задаётся | Плюс | Минус |
|---|---|---|---|
| **(а1) Свой абсолютный X для каждого шаблона** — в `victory_config_json`, как пороги калибровки A | `passive_income_share_min: { share: 0.3 }` (студент 0,15; профи 0,40; руководитель 0,85; предприниматель — см. а3) | Один тип цели, понятный текст на экране («пассивный доход покрывает 40% расходов»), подход тот же, что у калибровки A | Пороги подбираются руками и пересчитываются при каждом сдвиге баланса |
| **(а2) +N п. п. от старта акта 2** | В профиле запоминается доля на старте акта 2 | Сама выравнивает шаблоны | Нужно новое поле состояния; на экране цель звучит хуже («ещё +20 п. п.»); на студенте всё равно P42 |
| **(а3) Акт 2 из двух шагов** — «закрыть самый дорогой долг» → «пассив ≥ X%» | Цепочка внутри акта 2 | Даёт предпринимателю путь и учит порядку «сначала долг, потом доход» | Нужен тип цели «долг закрыт» (есть ли он — проверить в MQ-ACT-04); больше копирайта |

**Рекомендация плана: (а1) + (а3) для предпринимателя.** Стартовые значения после MQ-ACT-01 уточняются так, чтобы `act2_runner` попадал в P25–P40:

- студент — 15%;
- профи — 40%;
- руководитель — 85%;
- предприниматель — шаг «долг закрыт» + 35%.

По грубой модели эти значения дают: студент 15% → P30, профи 40% → P29, руководитель 85% → P26. Все три в окне P25–P40, хотя студент с порогом 12% уже на P24 выпадает из окна. Предприниматель и при 35% не доходит до порога без погашения долга, поэтому ему нужен шаг а3.

## Open questions (остальные)

2. **Сколько актов:** план рассчитан на 2. Формат `acts` — массив, поэтому третий акт добавляется без смены контракта.
3. **Где хранить ходы актов.** Рекомендация — колонки `game_profiles.victory_act1_at_period` и `victory_final_at_period` (INT NULL). Гейт CS-4 читает их на каждом `evaluate_victory`; лезть за ними в `NotificationLog` в горячем пути дороже и хрупче. Миграция одна, аддитивная.
4. **Пороги акта 1** — после волны 10–20, не в этом плане.

---

## Tasks

### MQ-ACT-01 — Симуляция: политика `act2_runner` и доля пассивного дохода

- **Phase:** `define` · **Tier:** `core` · **Skill:** `balance-playtest` · **Satellites:** `game-economy-and-victory` · **Next skill:** решение PO по OQ1
- **Spec:** Open questions §1; Testing CS-7
- **Acceptance:**
  - в `balance_simulate.py` есть политика `act2_runner`: до победы ведёт себя как `chain_runner`, после победы каждый ход вкладывает свободный поток сверх подушки 3× трат;
  - в строке хода отчёта и в `summary` есть `passive_share_burn` (пассив / `lifestyle_burn`); в `summary` — первый ход достижения долей 0,15 / 0,25 / 0,40 / 0,50 / 0,85;
  - таблица OQ1 пересчитана по этой политике на 4 шаблонах и вписана в этот план (или в `docs/balance/`).
- **Verify:** `cd backend && py -3 scripts/balance_playtest.py` (4 шаблона × `act2_runner`); `py -3 -m pytest -q`; эталоны других политик не меняются
- **Files:** `backend/scripts/balance_simulate.py`, `backend/scripts/balance_playtest.py`, отчёт `docs/balance/reports/…`
- **Estimate:** M · **Depends:** PR #16 в `main`

### MQ-ACT-02 — Контракт: `acts`, поля overview/bootstrap, хранение ходов актов

- **Phase:** `define` · **Tier:** `core` · **Skill:** `api-and-interface-design` · **Satellites:** `test-driven-development` · **Next skill:** `game-economy-and-victory`
- **Spec:** Data & API
- **Acceptance:**
  - Pydantic-схемы описывают поля, все необязательные с дефолтом «один акт»: `victory.act_index`, `acts_total`, `act_title`, `acts_completed[]`; `run_finale.kind` (`victory` | `victory_act` | `defeat`) и `act_index`;
  - в `docs/specs/features/SPEC_victory-acts.md` §Data зафиксированы JSON-формат `acts` и решение OQ3;
  - зеркало в `frontend-react/src/api/finance.js` и `game.js` описано (JSDoc), но экраны его ещё не читают.
- **Verify:** контрактный тест: ответ overview для конфига без `acts` совпадает с текущим снапшотом (CS-1, уровень API)
- **Files:** `backend/app/schemas.py` (или доменный модуль схем victory/finale), `frontend-react/src/api/finance.js`, `frontend-react/src/api/game.js`, spec
- **Estimate:** S · **Depends:** OQ3

### MQ-ACT-03 — Движок: акты, текущий акт, гейт акта 2

- **Phase:** `build` · **Tier:** `core` · **Skill:** `game-economy-and-victory` · **Satellites:** `test-driven-development`, `doubt-driven-development` · **Next skill:** `critical-test-scenarios`
- **Spec:** Rules & edge cases
- **Acceptance:**
  - `parse_victory_config` нормализует оба формата во внутренний список актов: без `acts` — один акт из `goals`;
  - `evaluate_victory` возвращает `act_index`, `acts_total`, `act_title`, `acts_completed`; цели акта N+1 не засчитываются, пока акт N не завершён, даже если `raw_met` = true;
  - `win_reached` = акт 1 завершён; `mechanics_unlock` считается только по шагам акта 1.
- **Critical scenarios:** CS-1, CS-3; плюс unit «unlock не зависит от акта 2»
- **Verify:** `cd backend && py -3 -m pytest -q tests/test_victory_engine.py tests/unit/victory`; затем полный `py -3 -m pytest -q`
- **Files:** `backend/app/victory/engine.py`, `backend/app/victory/seeds.py` (только parse), `backend/tests/test_victory_engine.py`, `backend/tests/unit/victory/test_acts.py` (новый)
- **Estimate:** M · **Depends:** MQ-ACT-02

### MQ-ACT-04 — Тип цели `passive_income_share_min`

- **Phase:** `build` · **Tier:** `core` · **Skill:** `game-economy-and-victory` · **Satellites:** `test-driven-development` · **Next skill:** MQ-ACT-06
- **Spec:** Open question 1 (вариант а1)
- **Acceptance:**
  - новый тип в `_evaluate_goal`: `met` = пассив за ход ≥ `share` × расходы на жизнь; `progress` 0..1; `detail` = {`passive`, `burn`, `share`};
  - `goals_lint.py` знает тип и проверяет `0 < share ≤ 2`;
  - проверено, есть ли тип «долг закрыт» для варианта а3; если нет — отдельная задача MQ-ACT-04b (не в этом срезе).
- **Verify:** unit на граничные значения (`burn = 0`, `share` на границе); `py -3 -m pytest -q`
- **Files:** `backend/app/victory/engine.py`, `backend/app/victory/snap.py` (если в snap нет `lifestyle_burn`), `backend/app/victory/goals_lint.py`, тесты
- **Estimate:** S · **Depends:** MQ-ACT-03

### MQ-ACT-05 — `victory_goals.act_key`: миграция и синхронизация

- **Phase:** `build` · **Tier:** `core` · **Skill:** `db-baselines-and-migrations` · **Satellites:** `test-driven-development` · **Next skill:** `game-economy-and-victory`
- **Spec:** Models / DB
- **Acceptance:**
  - `backend/migrations/00NN_victory_goals_act_key.sql` (следующий номер после последнего в `main`; сейчас 0050): `ADD COLUMN IF NOT EXISTS act_key TEXT NULL`;
  - `seeds/victory_goals.py` пишет `act_key` из `acts[*].key`; `goals_store.load_victory_goals_for_template` собирает акты обратно; `NULL` = один акт;
  - SQLite (тесты) — fallback на JSON-конфиг шаблона, как сейчас.
- **Critical scenarios:** CS-6
- **Verify:** `py -3 -m pytest -q` (unit seeds); `bash backend/scripts/db.sh migrate` на локальном PostgreSQL, повторный прогон без ошибок
- **Files:** `backend/migrations/00NN_victory_goals_act_key.sql`, `backend/app/seeds/victory_goals.py`, `backend/app/victory/goals_store.py`, тест seeds
- **Estimate:** M · **Depends:** MQ-ACT-03

### MQ-ACT-06 — Сиды: `acts` в четырёх шаблонах

- **Phase:** `build` · **Tier:** `core` · **Skill:** `game-economy-and-victory` · **Satellites:** `balance-playtest` · **Next skill:** MQ-ACT-09
- **Spec:** Scope «Сиды»
- **Acceptance:**
  - в `victory_config_json` четырёх шаблонов: `act_1` = нынешняя цепочка калибровки A без изменений, `act_2` = цель(и) по решению OQ1;
  - legacy `parallel`-конфиги не тронуты;
  - `balance_playtest` по `chain_runner`: `win_at_period` акта 1 совпадает с эталоном.
- **Verify:** `py -3 -m pytest -q`; `py -3 scripts/balance_playtest.py` → `balance_diff` по акту 1 без изменений
- **Files:** `backend/app/victory/seeds.py`, тест на структуру конфигов
- **Estimate:** S · **Depends:** MQ-ACT-04, OQ1

### MQ-ACT-07 — Профиль: ходы актов и «не два финала за ход»

- **Phase:** `build` · **Tier:** `core` · **Skill:** `game-economy-and-victory` · **Satellites:** `critical-test-scenarios`, `db-baselines-and-migrations` · **Next skill:** MQ-ACT-08
- **Spec:** Rules & edge cases; Models / DB
- **Acceptance:**
  - миграция `00NN_game_profiles_victory_acts.sql`: `victory_act1_at_period`, `victory_final_at_period` (INT NULL); поля в `models.py`;
  - при закрытии хода в `maybe_mark_victory_outcome` проставляется ход завершения акта; акт 2 не завершается в том же ходу, что акт 1;
  - поражение после акта 1: `run_outcome=defeat`, `victory_act1_at_period` сохранён.
- **Critical scenarios:** CS-4, CS-5
- **Verify:** integration close: `py -3 -m pytest -q tests/integration` (новые кейсы); полный `py -3 -m pytest -q`
- **Files:** `backend/migrations/00NN_game_profiles_victory_acts.sql`, `backend/app/models.py`, `backend/app/game/run_finale.py`, `backend/app/game/period.py` (только вызов), тесты
- **Estimate:** M · **Depends:** MQ-ACT-03, OQ3

### MQ-ACT-08 — Overview, bootstrap и финал после каждого акта

- **Phase:** `build` · **Tier:** `core` · **Skill:** `game-economy-and-victory` · **Satellites:** `api-and-interface-design`, `critical-test-scenarios` · **Next skill:** `critical-test-scenarios`
- **Spec:** Endpoints; User flows 1–3
- **Acceptance:**
  - `GET /api/finance/overview` → `victory` отдаёт поля акта;
  - `GET /api/game/bootstrap` → `run_finale.kind=victory_act`, `act_index=1` после акта 1; после dismiss финал акта 1 больше не показывается, а финал акта 2 — показывается;
  - `dismiss_victory_finale` различает акты: метка показа финала хранится по каждому акту, без потери нынешней `victory_finale_shown_at` для одноактных конфигов.
- **Critical scenarios:** CS-2
- **Verify:** integration bootstrap/overview; `py -3 -m pytest -q`
- **Files:** `backend/app/finance/overview_build.py`, `backend/app/game/run_finale.py`, `backend/app/services/game/run_finale.py`, `backend/app/routers/game.py` (без логики, только DTO), тесты
- **Estimate:** M · **Depends:** MQ-ACT-07

### MQ-ACT-09 — Инварианты INV-4 и INV-1 (акт 2) в `balance_diff`

- **Phase:** `verify` · **Tier:** `core` · **Skill:** `balance-playtest` · **Satellites:** `economy-reviewer` (субагент), `economy-balance-runner` · **Next skill:** `code-review-and-quality`
- **Spec:** Objective «Успех»; CS-7
- **Acceptance:**
  - `INVARIANTS` в `backend/scripts/balance_diff.py`: `act1_window = (12, 18)` для `chain_runner` (INV-4); `win_window` у INV-1 читает `act2_at_period` (хотя бы одна политика, по умолчанию `act2_runner`, в P25–P40);
  - в отчёте симуляции в `summary` есть `act1_at_period`, `act2_at_period`; проверка «нет пустых 10+ ходов между P5 и финалом акта 1» по `goals_met`;
  - эталоны `docs/balance/baselines/` обновлены **только с согласия PO**; `docs/balance/THRESHOLDS.md` дополнен.
- **Critical scenarios:** CS-7
- **Verify:** `cd backend && py -3 scripts/balance_playtest.py --invariants fail` зелёный на 4 шаблонах
- **Files:** `backend/scripts/balance_diff.py`, `backend/scripts/balance_simulate.py`, `docs/balance/baselines/*`, `docs/balance/THRESHOLDS.md`
- **Estimate:** M · **Depends:** MQ-ACT-06, MQ-ACT-07

### MQ-ACT-10 — Design-lab: «Цель · Акт N из 2» и финал акта 1

- **Phase:** `define` · **Tier:** `core` · **Skill:** `design-lab-mqx` · **Satellites:** — · **Next skill:** `frontend-ui-engineering`
- **Spec:** UI / UX
- **Acceptance:**
  - раунд `design-lab/dashboard/goal-acts-round/` (self-contained, `sync-lab.sh`, в `nav.manifest.json`) с вариантами подписи акта, состояниями (акт 1 в процессе, финал акта 1, акт 2 старт, акт 2 близко) на 412 и 1440;
  - ★ от PO записан в README раунда; перенос в prod — только после APPROVED (lab + prod + APPROVED в одном PR, `canon-sync`).
- **Verify:** `cd frontend-react && npm run check:guardrails`; открыть раунд через `cd design-lab && npx serve .`
- **Files:** `design-lab/dashboard/goal-acts-round/*`, `design-lab/nav.manifest.json`
- **Estimate:** S · **Depends:** — (можно параллельно с бэкендом; черновой раунд сделан 2026-11-02, статус review)

### MQ-ACT-11 — FE prod: блок «Цель» с актом и финал акта 1

- **Phase:** `build` · **Tier:** `core` · **Skill:** `frontend-ui-engineering` · **Satellites:** `critical-test-scenarios`, `mqx-ui-reviewer` · **Next skill:** `code-review-and-quality`
- **Spec:** User flows 1–2; UI / UX
- **Acceptance:**
  - `MqxGoalDash` показывает подпись «Акт N из 2» и точки только текущего акта; без полей акта рендер как сейчас;
  - финал акта 1: заголовок «Акт 1 пройден» и строка «Дальше — акт 2: …»; «Играть дальше» ведёт на Главную с «Акт 2 из 2»;
  - одна реплика Монетки о новой цели при первом показе акта 2 (не новый онбординг); копирайт «ход», не «месяц».
- **Verify:** `npm run test:unit` (`buildGoalChainView` с актами и без), `npm run build`, `npm run check:guardrails`
- **Files:** `frontend-react/src/components/mqx/layout/MqxGoalDash.jsx`, модуль `buildGoalChainView`, компонент финала партии, `frontend-react/src/guidance/…` (реплика), unit-тесты
- **Estimate:** M · **Depends:** MQ-ACT-08, MQ-ACT-10 APPROVED

### MQ-ACT-12 — e2e CS-8: «Играть дальше» → «Акт 2 из 2»

- **Phase:** `verify` · **Tier:** `core` · **Skill:** `critical-test-scenarios` · **Satellites:** `frontend-ui-engineering` · **Next skill:** `code-review-and-quality`
- **Spec:** CS-8
- **Acceptance:**
  - Playwright-сценарий на mobile (412×915) и desktop (1440×900): партия доводится до финала акта 1, затем «Играть дальше» → на Главной видна подпись «Акт 2 из 2»;
  - быстрый путь к финалу — через e2e-шаблон с малыми порогами или тестовый сид стенда (`e2e/fixtures.js`); prod-код не получает тестовых ручек.
- **Verify:** `cd frontend-react && npm run test:e2e`
- **Files:** `frontend-react/e2e/victory-acts.spec.js`, `frontend-react/e2e/fixtures.js`, при необходимости сид e2e-стенда
- **Estimate:** S/M · **Depends:** MQ-ACT-11

### MQ-ACT-13 — Документы

- **Phase:** `ship` · **Tier:** `support` · **Skill:** `documentation-and-adrs` · **Satellites:** — · **Next skill:** —
- **Acceptance:**
  - `SPEC_victory-acts` → `implemented`; в `SPEC_victory-v2` и `SPEC_game-run-finale` — ссылки на акты;
  - нужен ли ADR к ADR-002 о формате `acts` — решить при ревью;
  - PR-18/PR-21 в `PLAN_production-ready` → ✅; строка в `docs/CHANGELOG.md`.
- **Verify:** `py -3 scripts/check_conventions.py`
- **Estimate:** S · **Depends:** все выше
