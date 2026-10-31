---
name: test-driven-development
description: Test-first workflow for ТВОЙ ХОД — pytest for backend game logic (period, victory, events, finance) and FE contract tests. Use when fixing a bug with a reproducible failure or changing economy or API behavior that tests should pin.
argument-hint: "[bug, behavior, or test file focus]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash(python -m pytest *), Bash(py -3 -m pytest *), Bash(npm run test:unit *)
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **как** писать тест; **что** покрыть и min gate G1–G4 — [`critical-test-scenarios`](../critical-test-scenarios/SKILL.md).

# Test-Driven Development

## Прочитай сначала (ТВОЙ ХОД)

- [`CLAUDE.md`](../../../CLAUDE.md)
- [`docs/specs/features/`](../../../docs/specs/features/)
- [`backend/app/game/period.py`](../../../backend/app/game/period.py) — экономика периода
- [`backend/app/README.md`](../../../backend/app/README.md)
- [`backend/tests/README.md`](../../../backend/tests/README.md)

**Куда писать:** `backend/tests/`, `frontend-react/src/` (затронутые модули). **Дальше:** `critical-test-scenarios` (gate на срез), `code-review-and-quality`.

## Цикл

1. **RED** — тест, который падает по правильной причине (не на импорте или опечатке). Для бага — сначала воспроизведение: тест повторяет сценарий из отчёта и падает на старом коде.
2. **GREEN** — минимальный фикс, чтобы тест прошёл; остальные тесты модуля зелёные.
3. **REFACTOR** — чистка при зелёных тестах; поведение не меняется.

Тест проверяет **состояние** (баланс, `period_index`, записи `Transaction`, JSON ответа), а не то, какие функции вызывались. Моки — только на границе (Telegram, внешняя сеть, сбой посреди транзакции), не вместо БД.

## Инфраструктура backend

- **Запуск:** `cd backend && python -m pytest -q` (Windows: `py -3 -m pytest -q`); точечно — `-k <name>` или путь к файлу. БД не нужна: тесты идут на SQLite (`backend/tests/conftest.py`).
- **Фикстуры `conftest.py`:** `db_session`, `test_user`, `auth_headers`, `admin_env`, `seed_basic_template`, `client` (TestClient с подменой `get_db`).
- **Хелперы `tests/fixtures/`:** `game.py` (`create_game_profile`, `create_profile_ready_for_period_close`, обязательства), `victory.py` (снапшоты и конфиги победы), `events.py`, `capital.py`, `dl1_catalog.py`, `money.py` (`assert_finite_money`). Новый повторяющийся setup — сюда, а не копией в тест.
- **Патчить там, где имя используется:** `app.game.period.ensure_period_events`, а не `app.services.events.service...` — фасад реэкспортирует имена, и подмена в нём на вызовы не повлияет.
- **Postgres-специфика** (`FOR UPDATE`, JSONB) на SQLite не проверяется: блокировки тестируй через поведение (двойной вызов → один эффект), а не через SQL.
- **Раскладка:** `tests/unit/<домен>/`, `tests/integration/api/`, контрактные и регрессионные — `tests/test_<тема>.py`.

## Инфраструктура frontend

`cd frontend-react && npm run test:unit` — `node --test` по `*.test.js` (utils, mqx, screens). Чистые функции отображения (`utils/periodClose*.js`, форматтеры денег) тестируются без DOM.

## Критичные зоны

Для **`backend/app/game/period.py`**, **`backend/app/victory/`**, **`backend/app/finance/`**, денежных эндпоинтов (`invest`, `period`, `events/choose`) reproduction-тест **обязателен**. Регрессия здесь ломает core loop, деньги или победу; «почини без теста» не принимается без явного продуктового риска.

## Verification

- [ ] Новый тест падает на старом коде и проходит на новом (проверено, а не предположено).
- [ ] Весь `pytest -q` зелёный (или известные падения названы и не связаны с изменением).
- [ ] При смене FE-контракта — `npm run test:unit` зелёный.

---

## Итог (Verdict)

| Verdict | Когда |
|---------|--------|
| **PASS** | failing test → minimal fix → pytest green |
| **CONCERNS** | пользователь настаивает на hotfix без теста в критичной зоне — зафиксируй риск, предложи минимальный тест |
| **FAIL** | код/тесты записаны без reproduction-теста на баг в критичной зоне |

## Согласование изменений

Перед записью в репо (тесты в `backend/tests/`, prod-код в `backend/` / `frontend-react/`): **May I write** / **Могу записать** тест и фикс? — если пользователь не дал явное «делай» / «запиши».

## Следующий шаг

- [`critical-test-scenarios`](../critical-test-scenarios/SKILL.md) — gate G1–G4 на срез
- [`code-review-and-quality`](../code-review-and-quality/SKILL.md) — перед merge
