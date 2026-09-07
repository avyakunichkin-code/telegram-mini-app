---
layer: audits
kind: engineering
status: active
last_reviewed: 2026-09-07
audience: engineering, agents
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/engineering
aliases:
  - "Технические аудиты — куда класть"
---
# Kind `engineering` — технические аудиты

Сюда кладётся **следующий** технический снимок: архитектура, код, API, схема БД, infra, security, performance, DX.

Канон папки: [`../README.md`](../README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

## Путь

```text
docs/audits/engineering/<YYYY-MM-DD>-<slug>.md
```

| Тема | Slug (пример) | Primary skill (ориентир) |
|------|----------------|--------------------------|
| Архитектура, границы доменов, техдолг | `architecture` | `documentation-and-adrs` (запись) + обзор кода |
| Security / auth / secrets | `security` | `security-and-hardening` (**deferred** — явный запрос) |
| Performance FE/BE | `performance` | `performance-optimization` (deferred) |
| Infra, хостинг, backup | `platform` | `release-web` / ops docs |

Один PR/сессия — один slug. Security не смешивать с DX-онбордингом.

## Что покрыть (минимум)

1. Стек и границы (ссылки на `backend/app/README.md`, `frontend-react/ARCHITECTURE.md`, ADR-007).
2. Сильные стороны — чтобы не «переписать всё».
3. Риски с критичностью и **конкретным файлом/слоем**.
4. План до production-ready: P0–P3, зависимости, verify (pytest, не «кажется ок»).
5. Что **не** в scope: баланс событий, FTUE-копирайт, монетизация — это [`../product/`](../product/).

## Текущий снимок

Актуальный технический аудит:

[`2026-09-07-architecture.md`](2026-09-07-architecture.md) (DRAFT) — `supersedes` → [`ARCHITECTURE_ASSESSMENT_2026-06.md`](../../vision/ARCHITECTURE_ASSESSMENT_2026-06.md).

Assessment июня **не удалять** (ссылки из backlog/handbook). Следующий снимок — новый файл с новой датой.

Продуктовый аудит (core loop, экономика игрока, retention) — **не сюда**: [`../product/2026-09-07-product-game-design.md`](../product/2026-09-07-product-game-design.md).

QA (гонки, чек-листы, testability) — [`../qa/2026-09-07-mechanics.md`](../qa/2026-09-07-mechanics.md).
