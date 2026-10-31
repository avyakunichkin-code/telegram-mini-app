---
layer: index
status: active
last_reviewed: 2026-10-29
tracks: spl, plan-v1
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
  - tvoy-hod/topic/plan-v1
aliases:
  - "Направление Plan (`docs/plan/`)"
---
# Направление Plan — «ТВОЙ ПЛАН»

Семейный финансовый чекап: отдельный продукт, не режим игры ([ADR-016](../decisions/ADR-016-two-products-shared-fincore.md)). С игрой общие только `packages/fincore` и, позже, `packages/platform`.

**Цель направления сейчас — рабочий прототип** (поправка D4 от 2026-10-27): путь «вход → вопрос → семья → быстрый старт → уточнение → отчёт → шаг» на настоящих расчётах `fincore`, без БД, деплоя и реальных пользователей.

Документы игры остаются в общем `docs/` — эта папка только для Plan. Карта роадмапов всех направлений — [`../ROADMAPS.md`](../ROADMAPS.md).

## Документы

| Слой | Документ | Статус |
|------|----------|--------|
| Роадмап | [`ROADMAP.md`](ROADMAP.md) | active — P0 «рабочий прототип» закрыт 2026-10-28, решение по P1 |
| Spec | [`specs/SPEC_plan-v1.md`](specs/SPEC_plan-v1.md) | approved 2026-10-26 (SPL-401) |
| Idea | [`vision/plan-financial-assistant.md`](vision/plan-financial-assistant.md) | approved 2026-10-26 (SPL-002) |
| ADR | [ADR-016](../decisions/ADR-016-two-products-shared-fincore.md) — два продукта, п.8 о прототипе | accepted, amended 2026-10-27 |
| Ядро | [`../plans/PLAN_game-plan-split.md`](../plans/PLAN_game-plan-split.md) — вынос `fincore` и `platform` (общий для Game и Plan) | approved |

Новые документы Plan кладём сюда по тем же слоям: `vision/` → `specs/` → `plans/` (когда понадобится план срезов) → `ROADMAP.md`.

## Код

| Путь | Что |
|------|-----|
| [`apps/plan-api`](../../apps/plan-api/) | FastAPI-прототип: хранилище в памяти, `dev_code` вместо письма; отчёт, сценарии и шаги считает `fincore` |
| [`apps/plan-web`](../../apps/plan-web/) | Vite + React: экраны входа, вопроса, семьи, быстрого старта, уточнения и отчёта; дизайн-система «Бенто» (своя, не MQX игры) |
| [`packages/fincore`](../../packages/fincore/README.md) | Общее ядро; для Plan добавлено только `member_id` в `Income` и `Liability` |
| `sites/tvoy-plan-landing` | Лендинг Plan — **отдельный репозиторий** [`tvoy-plan-landing`](https://github.com/avyakunichkin-code/tvoy-plan-landing) (свой `origin`, GitHub Pages); локальный checkout лежит здесь и игнорируется `.gitignore` этого репо |

Запуск (Claude Code, `.claude/launch.json`): `plan-api` (:8020) и `plan-web` (:5190). Тесты: `cd apps/plan-api && py -3 -m pytest -q`; сверка до копейки — `packages/fincore/tests/test_reconciliation.py`; e2e (CS-11, 375 px и десктоп, свой стенд :8021/:5191) — `cd apps/plan-web && npm run test:e2e`.

## Канон при конфликте

[C-1](../../CONVENTIONS.md): код + тесты `apps/plan-*` → [`SPEC_plan-v1`](specs/SPEC_plan-v1.md) → [idea](vision/plan-financial-assistant.md). Игровые `SPEC_PRODUCT` и `docs/specs/` к Plan не относятся.
