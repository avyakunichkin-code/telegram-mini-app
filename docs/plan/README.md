---
layer: index
status: active
last_reviewed: 2026-11-03
tracks: spl, plan-v1
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
  - tvoy-hod/topic/plan-v1
aliases:
  - "Направление Plan (`docs/plan/`)"
---
# Направление Plan — «ТВОЙ ПЛАН»

Семейный финансовый чекап: отдельный продукт, не режим игры ([ADR-016](../decisions/ADR-016-two-products-shared-fincore.md)). Общие библиотеки — `packages/fincore`, `packages/platform`, `packages/api-client` и минимальный `packages/ui-kit`; продуктовые экраны и оформление раздельны.

**Цель направления сейчас — продуктовый каркас P2** ([ADR-017](../decisions/ADR-017-plan-p2-without-game-gate.md), поправка D4 от 2026-11-02): `platform`, БД `plan`, вход по почте, ui-kit, CI — без gate игры. Реальные пользователи и деплой — после юриста по ПДн и решения PO. Прототип P0 закрыт 2026-10-28.

Документы игры находятся в [`docs/game/`](../game/README.md) — эта папка только для Plan. Карта роадмапов всех направлений — [`../ROADMAPS.md`](../ROADMAPS.md).

Вопросы владельцу и инженерные уточнения — [QUESTIONS](QUESTIONS.md). План продукта — [P3](plans/PLAN_plan-v1.md), будущей выкатки — [деплой](plans/PLAN_plan-deploy.md).

**Frontend:** [plan-web](../../apps/plan-web/README.md) · **Дизайн:** [Plan design](DESIGN.md) · **Инструкции:** [AGENTS](AGENTS.md).

## Документы

**[Мои задачи по ТВОЙ ПЛАН](tasks/index.html)** — единая страница владельца:
поиск, сортировка, приоритеты, личные отметки и ссылки на исходные материалы.
Весь реестр и отдельные карточки собраны в [tasks/](tasks/README.md).

Для первых 3–5 сессий варианта А на вымышленных данных подготовлен
[комплект ведущего](research/SESSION_KIT.md): карточка, сценарий, бланк и
агрегирование наблюдений. Сессии ещё не проведены.

| Слой | Документ | Статус |
|------|----------|--------|
| Роадмап | [`ROADMAP.md`](ROADMAP.md) | active — P0 закрыт, P2 частично реализован; минимальный ButtonBase подключён к Game/Plan, утверждённый отчёт M1/F2/A2/S1 перенесён; P2 целиком ещё не закрыт |
| Spec | [`specs/SPEC_plan-v1.md`](specs/SPEC_plan-v1.md) | approved 2026-10-26 (SPL-401) |
| Spec | [`specs/SPEC_plan-insights.md`](specs/SPEC_plan-insights.md) | 2026-11-09 — API `insights` и утверждённый вариант А локально реализованы |
| Idea | [`vision/plan-financial-assistant.md`](vision/plan-financial-assistant.md) | approved 2026-10-26 (SPL-002) |
| ADR | [ADR-016](../decisions/ADR-016-two-products-shared-fincore.md) — два продукта, п.8 о прототипе | accepted, amended 2026-10-27 |
| Ядро | [`../plans/PLAN_game-plan-split.md`](../plans/PLAN_game-plan-split.md) — вынос `fincore` и `platform` (общий для Game и Plan) | approved |

Новые документы Plan кладём сюда по тем же слоям: `vision/` → `specs/` → `plans/` (когда понадобится план срезов) → `ROADMAP.md`.

## Код

| Путь | Что |
|------|-----|
| [`apps/plan-api`](../../apps/plan-api/) | FastAPI-каркас P2: SQL-репозиторий через platform, JWT, локальная SQLite по умолчанию; письмо пока LogMailer; финансовые расчёты через fincore |
| [`apps/plan-web`](../../apps/plan-web/) | Vite + React: экраны входа, вопроса, семьи, быстрого старта, уточнения и отчёта; дизайн-система «Бенто» (своя, не MQX игры) |
| [`packages/ui-kit`](../../packages/ui-kit/README.md) | Общее нативное поведение ButtonBase; реальные адаптеры Game и Plan, оформление раздельное |
| [`packages/fincore`](../../packages/fincore/README.md) | Общее ядро; для Plan добавлено только `member_id` в `Income` и `Liability` |
| `sites/tvoy-plan-landing` | Лендинг Plan — **отдельный репозиторий** [`tvoy-plan-landing`](https://github.com/avyakunichkin-code/tvoy-plan-landing) (свой `origin`, GitHub Pages); локальный checkout лежит здесь и игнорируется `.gitignore` этого репо |

Локальные сервисы: `plan-api` (:8020) и `plan-web` (:5190). Тесты: `cd apps/plan-api && py -3 -m pytest -q`; сверка до копейки — `packages/fincore/tests/test_reconciliation.py`; e2e (CS-11, 375 px и десктоп, свой стенд :8021/:5191) — `cd apps/plan-web && npm run test:e2e`.

## Канон при конфликте

[C-1](../../CONVENTIONS.md): код + тесты `apps/plan-*` → [`SPEC_plan-v1`](specs/SPEC_plan-v1.md) → [idea](vision/plan-financial-assistant.md). Игровые `SPEC_PRODUCT` и `docs/game/specs/` к Plan не относятся.
