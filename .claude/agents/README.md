# Project subagents (ТВОЙ ХОД)

Разделение обязанностей — **не смешивать домены**:

| Subagent | Проверяет | Не проверяет |
|----------|-----------|----------------|
| **economy-reviewer** | period, victory, events, числа в seeds/миграциях, pytest backend | UI, lab, «красиво ли» |
| **mqx-ui-reviewer** | DESIGN_WORKFLOW, MQX, lab/prod/canon по размеру PR | экономику, pytest |
| **economy-balance-runner** | 30–40 периодов sim + diff vs baseline (`docs/balance/`) | код, UI, pytest |

Формат — [Claude Code subagents](https://code.claude.com/docs/en/sub-agents): `name`, `description` (по нему Claude решает, когда делегировать), `tools` / `disallowedTools` — least privilege. Этот README без frontmatter Claude пропускает (не агент).

Метаданные: [`catalog.yaml`](../skills/catalog.yaml) → `agents:`.

**Persistent memory.** `economy-reviewer` — `memory: project`: заметки в `.claude/agent-memory/economy-reviewer/` (в git, первые 200 строк `MEMORY.md` грузятся в его промпт). `memory` автоматически включает Read/Write/Edit, поэтому read-only гарантия держится frontmatter-хуком `PreToolUse` → [`hooks/agent-memory-only.mjs`](../hooks/agent-memory-only.mjs): запись только в свою папку памяти, остальное — exit 2. Без auto memory (`autoMemoryEnabled: false` / `CLAUDE_CODE_DISABLE_AUTO_MEMORY`) поле не действует. Новый read-only агент с `memory` без такого хука — WARN в `_claude-config-check.mjs`.

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
