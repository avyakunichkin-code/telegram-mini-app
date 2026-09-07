---
layer: audits
kind: qa
status: active
last_reviewed: 2026-09-07
audience: qa, engineering, agents
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/qa
aliases:
  - "QA-аудиты — куда класть"
---
# Kind `qa` — аудиты механик, edge cases, testability

Сюда кладётся снимок **игровых систем как объекта тестирования**: гонки, стресс, воспроизводимость, покрытие автотестами, валидация входов, UI-баги, которые ломают механики.

Канон папки: [`../README.md`](../README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

## Путь

```text
docs/audits/qa/<YYYY-MM-DD>-<slug>.md
```

| Тема | Slug (пример) |
|------|----------------|
| Механики TB1, период, события, деньги | `mechanics` |
| Стресс / нагрузка API | `stress` |
| Контракт FE↔BE / регрессионный gate | `test-gate` |

Не смешивать с [`../engineering/`](../engineering/) (архитектура, infra, security как дизайн), [`../product/`](../product/) (баланс как GD) и [`../ux/`](../ux/) (иерархия экранов). Перекрытие формулировать как **сценарий QA**, со ссылкой на другой kind.

## Текущий снимок

[`2026-09-07-mechanics.md`](2026-09-07-mechanics.md) (DRAFT).
