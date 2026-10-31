---
layer: plan
epic_id: PLT
phase: define
status: draft
owner: ops
last_reviewed: 2026-06-21
parent: PLAN_PLT.md
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/draft
aliases:
  - PLAN_INFRA
  - "Plan: PLT infra / deploy"
---
# Plan: PLT — Infra / deploy (фаза 0)

**Родитель:** [`PLAN_PLT.md`](PLAN_PLT.md) · **Статус:** **draft** — ждём выбора целевой инфраструктуры.

## Зачем отдельный план

Переезд на платные рельсы зависит от выбора хостинга (Render Starter, VPS, другое). Задачи PLT-001…008 из PLAN_PLT переносятся сюда для детальной декомпозиции **после** решения.

## Черновик scope (без порядка)

| ID | Задача |
|----|--------|
| INFRA-001 | Выбор провайдера API + БД |
| INFRA-002 | Домен `app.*` + `api.*` + SSL |
| INFRA-003 | CORS / env / CI variables |
| INFRA-004 | Миграции prod + smoke |
| INFRA-005 | Бэкап + restore drill |
| INFRA-006 | Uptime monitoring |

## Ссылки

- [`DEPLOY.md`](../ops/DEPLOY.md) — текущая схема Render + GitHub Pages
- [`render.yaml`](../../render.yaml)

## Open questions

1. Остаёмся на Render или переезд на VPS?
2. Один домен для PWA/TMA или раздельные?
3. Staging-окружение нужно до CA?

---

*Заполнить после выбора инфраструктуры → APPROVED → выполнить перед полным PLT P0 gate.*
