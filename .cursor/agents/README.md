# Project subagents (ТВОЙ ХОД)

Разделение обязанностей — **не смешивать домены**:

| Subagent | Проверяет | Не проверяет |
|----------|-----------|----------------|
| **economy-reviewer** | period, victory, events, числа в seeds/миграциях, pytest backend | UI, lab, «красиво ли» |
| **mqx-ui-reviewer** | DESIGN_WORKFLOW, MQX, lab/prod/canon по размеру PR | экономику, pytest |

Метаданные: [`catalog.yaml`](../skills/catalog.yaml) → `agents:`.

## Когда вызывать

```text
# Сменили зарплату в seed 20000→30000
Use economy-reviewer — проверит traceability, тесты, pytest, не «нравится ли баланс».

# Новая карточка Dashboard
Use mqx-ui-reviewer — крупное → lab+prod+APPROVED в одном PR.
```

## Политики (согласовано)

1. **UI крупное** → один PR: lab + prod + APPROVED. **Мелочь** → canon в follow-up (CONCERNS).
2. **Экономика** → **NEEDS REVISION** без зелёного `pytest -q` при изменении логики/данных.
3. **pytest** — зона economy-reviewer; guardrails — advisory в mqx-ui-reviewer.
