---
name: critical-test-scenarios
description: >-
  Plans and adds critical-path tests (not 100% coverage). Use when shipping new
  approved functionality, expanding the test suite, reviewing test quality, or
  mapping spec acceptance criteria to pytest/vitest. Use after spec approval and
  before merge to ensure at least the highest-risk scenarios are automated.
argument-hint: "[feature, spec path, domain, or test backlog item]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

# Critical Test Scenarios

## Прочитай сначала (ТВОЙ ХОД)

- [`backend/tests/README.md`](../../../backend/tests/README.md) — пирамида, маркеры, backlog, качество vs coverage
- [`docs/templates/SPEC_FEATURE.md`](../../../docs/templates/SPEC_FEATURE.md) — § Testing strategy / Critical scenarios
- [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md) — место в конвейере
- [`pytest.ini`](../../../backend/pytest.ini) — маркеры `unit`, `integration`, `contract`, `acceptance`
- [`frontend-react/package.json`](../../../frontend-react/package.json) — `test:unit`, `test:mqx`

**Куда писать:** `backend/tests/{unit,integration,acceptance}/`, `frontend-react/src/**/__tests__/`.  
**Satellite для написания одного теста:** `test-driven-development` (RED → GREEN).  
**Дальше:** `code-review-and-quality` (gate перед merge).

## Overview

**Цель — не 100% coverage**, а автоматизация **критичных сценариев**, которые ловят регрессии продукта: экономика периода, события, победа, контракты API↔UI.

| Скилл | Роль |
|-------|------|
| **critical-test-scenarios** (этот) | *Что* покрыть, *где* положить, минимальный gate, backlog |
| **test-driven-development** | *Как* писать один тест: RED → GREEN → REFACTOR |
| **balance-playtest** | 30–40 периодов, метрики баланса (не замена pytest) |

## When to Use

- Новая **утверждённая** фича (spec § Acceptance / Testing strategy)
- Закрытие среза `incremental-implementation` — проверить gate
- Расширение test suite по backlog из `backend/tests/README.md`
- Ревью: «тесты проверяют поведение или только status 200?»
- После canon-sync lab → prod (MQX) — contract-тесты display/serialize

**When NOT to use:** чисто косметический CSS без смены контракта; docs-only; rename без поведения.

## Минимальный gate (Definition of Done)

Новый **поведенческий** функционал не считается готовым к merge без **хотя бы одного** автотеста на каждый пункт ниже, если применимо:

| # | Сценарий | Слой | Пример |
|---|----------|------|--------|
| G1 | **Happy path** — основной пользовательский результат | integration или acceptance | salary claimed → cash ↑ |
| G2 | **Граница / отказ** — явный негатив или guard | unit или integration | повтор claim → 409; нет полиса → choice скрыт |
| G3 | **Контракт FE↔BE** — поля, которые читает UI | unit + integration | `event_domain`, `insurance_claim` в pending |
| G4 | **Бизнес-инвариант** — деньги, streak, victory | unit или integration | cash не NaN; chain step met |

**Исключения (документировать в PR):** только визуал lab; hotfix с follow-up MQ-* на тест в течение следующего среза.

## Конвейер разработки

```text
spec (§ Critical scenarios)     spec-driven-development
        ↓
plan / MQ-* (Verify + Critical) planning-and-task-breakdown
        ↓
код среза                       incremental-implementation
        ↓ satellites
        critical-test-scenarios + test-driven-development
        ↓
pytest / npm run test:unit      (зелёные)
        ↓
review gate                     code-review-and-quality
```

### В spec (до кода)

В `docs/specs/features/SPEC_*.md` заполни таблицу **Critical scenarios (min gate)**:

```markdown
| ID | Scenario | Layer | Command / path |
|----|----------|-------|----------------|
| CS-1 | … | integration | `pytest tests/integration/api/test_….py` |
| CS-2 | … | unit | `pytest tests/unit/…` |
```

Минимум **2 строки** на нетривиальную фичу (happy + boundary или contract).

### В задаче MQ-*

В frontmatter / секции **Verify:**

- `critical_scenarios: [CS-1, CS-2]`
- команды: `pytest -q -k "…"`, `npm run test:unit`

### После реализации

1. Пройди чеклист G1–G4 (отметь N/A где не применимо).
2. Добавь тесты в правильный слой (см. ниже).
3. Запусти:
   ```bash
   cd backend && python -m pytest -q
   cd frontend-react && npm run test:unit
   ```
4. Обнови backlog в `backend/tests/README.md`, если закрыл пункт.

## Пирамида и размещение

```
        acceptance/     ← mq116, «как игрок» (редко, высокая цена)
       / integration/    ← TestClient + DB, контракт JSON
      /   unit/          ← serialize, victory, impacts, pure helpers
     / contract/         ← YAML catalog, schema parity
```

| Изменили | Куда тест | Маркер |
|----------|-----------|--------|
| `backend/app/events/` serialize, filters | `tests/unit/events/` | `@pytest.mark.unit` |
| Router `/api/game/events/*` | `tests/integration/api/` | `@pytest.mark.integration` |
| `period.py`, victory engine | `tests/unit/game/`, `tests/unit/victory/` | `unit` |
| End-to-end игрок | `tests/acceptance/` | `acceptance`, часто `slow` |
| `eventDisplay.js`, MQX helpers | `frontend-react/src/.../__tests__/*.contract.test.js` | vitest |
| YAML `data/events/mvp11/` | `test_mvp11_yaml_catalog` + `test_event_balance_contract` (trade-off gate, baseline 0) + `-k event` | — |

**Legacy:** корневые `tests/test_*.py` не трогать без причины; **новые** — только в подпапках.  
**Fixtures:** общий setup → `tests/fixtures/` (профиль, полис, шаблон).

## Как выбирать критичные сценарии

1. **Из spec** — каждый acceptance criterion → ≥1 тест или явный N/A.
2. **Из user flow** — шаг «игрок нажал X» → assert на состояние (cash, pending, victory).
3. **Из риска** — деньги, необратимые действия, скрытие UI-опций, auth.
4. **Из контракта API** — поля в `overview`, `pending`, `choose` response; FE contract test на mapping.
5. **Не дублировать** — один тест на инвариант; parametrized для вариантов persona/template.

### Хороший vs плохой тест

| Хороший | Плохой |
|---------|--------|
| Assert на **бизнес-следствие** | Только `status_code == 200` |
| **Given–When–Then** в комментарии или структуре | 80 строк copy-paste setup |
| **Именование:** `test_insurance_claim_hidden_without_active_policy` | `test_events_2` |
| Стабильные фабрики из `fixtures/` | Хардкод id из prod seed |

## Доменные чеклисты (ТВОЙ ХОД)

### События

- [ ] `GET /pending` — domain, insurance_claim, choices count
- [ ] `_choice_available_for_profile` — insurance_claim без полиса
- [ ] `POST /choose` — cash / needs / side effects
- [ ] FE: `eventDisplay` contract (clamp, domain class)

### Период / экономика

- [ ] `claim-salary` once per period
- [ ] `time/next` — obligations, overdue, defeat streak
- [ ] safety fund contribute/withdraw bounds

### Победа

- [ ] chain vs parallel по `template_key`
- [ ] `min_period_index_for_victory` gate
- [ ] mechanics_unlock после goal keys

### API / новое поле

- [ ] Поле в response schema (integration)
- [ ] `api.js` + hook/screen читает поле (FE contract или smoke в spec)

## Процедура сессии (agent)

1. **Scope** — spec, diff или backlog item; перечисли затронутые домены.
2. **Inventory** — `Glob`/`Grep` существующих тестов; не плодить дубликаты.
3. **Plan** — таблица CS-* (2–5 строк на фичу).
4. **Implement** — с `test-driven-development`: failing test first для нового поведения.
5. **Run** — pytest + `npm run test:unit`; зафиксируй команды в PR/spec.
6. **Backlog** — вычеркни или добавь пункты в `backend/tests/README.md`.

## Команды

```bash
# Backend — быстрый слой
cd backend && python -m pytest tests/unit -q

# Backend — домен
cd backend && python -m pytest -q -k "event or pending or insurance"

# Backend — integration
cd backend && python -m pytest tests/integration -q

# Frontend — unit/contract
cd frontend-react && npm run test:unit

# Guardrails (включает часть FE checks)
cd frontend-react && npm run check:guardrails
```

## Handoff

| Ситуация | Следующий скилл |
|----------|-----------------|
| Тесты зелёные, gate закрыт | `code-review-and-quality` |
| Нужен один тест на баг | `test-driven-development` |
| Крупная правка period/victory | `game-economy-and-victory` + `balance-playtest` |
| Новый UI без spec | `spec-driven-development` сначала |

## Согласование

Перед записью тестов: **Могу записать** файлы в `backend/tests/` и/или `frontend-react/src/**/__tests__/`?

Покажи таблицу **CS-*** (сценарий, слой, команда) — пользователь подтверждает scope до реализации.

## Session verdict

| Verdict | When |
|---------|------|
| **PASS** | Gate G1–G4 закрыт (или N/A задокументирован); pytest + `test:unit` зелёные; CS-* в spec/MQ-* выполнены |
| **CONCERNS** | Behavioral change без тестов — нужен follow-up MQ-* или явное исключение в PR |
| **BLOCKED** | Нет spec § Critical scenarios для нетривиальной фичи; нельзя оценить риск |

## Anti-patterns

- **Coverage hunting** — `# pragma: no cover` ради метрики
- **Snapshot всего JSON** без assert на ключевые поля
- **Mock всего** — integration дешевле для FastAPI + SQLite/Postgres test DB
- **Отложить тесты «на потом»** для G1–G3 без записи в MQ-* follow-up
- **100% E2E** — acceptance только для сквозных сценариев (mq116-уровень)

## References

- [`backend/tests/fixtures/game.py`](../../../backend/tests/fixtures/game.py)
- [`backend/tests/unit/events/test_serialize_instance_contract.py`](../../../backend/tests/unit/events/test_serialize_instance_contract.py)
- [`backend/tests/integration/api/test_events_pending_contract.py`](../../../backend/tests/integration/api/test_events_pending_contract.py)
- [`frontend-react/src/components/mqx/events/__tests__/eventDisplay.contract.test.js`](../../../frontend-react/src/components/mqx/events/__tests__/eventDisplay.contract.test.js)
