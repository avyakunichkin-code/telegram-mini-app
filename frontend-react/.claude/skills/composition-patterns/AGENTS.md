# React Composition Patterns (ТВОЙ ХОД — slim index)

> Полный гайд: [`AGENTS.full.md`](AGENTS.full.md). Skill: [`SKILL.md`](SKILL.md).

## Для MQX / ТВОЙ ХОД

1. **Без boolean prop explosion** — явные варианты или compound components (`Mqx*` семейства).
2. **Compound components + context** — state/actions/meta; UI не знает про `useGame` напрямую в leaf.
3. **Provider boundary** — кнопки/actions вне visual frame могут читать context (dialog pattern).
4. **React 19:** `ref` как prop; `use()` вместо `useContext()` где уже на 19+.

## Когда открывать AGENTS.full.md

- Новый переиспользуемый паттерн в `mqx/`
- Рефактор prop drilling на 4+ уровнях

## Не смешивать

- Продуктовый UI-конвейер: **design-lab-mqx** → **frontend-ui-engineering** (`DESIGN_WORKFLOW.md`).
