# Behavioral specs (`/skill-test spec`)

**Не дублируют `SKILL.md`.** Процедура для агента — в [`../<skill>/SKILL.md`](../).  
Здесь — **test cases** для ручного или behavioral `/skill-test spec [name]`.

| Тип | Файл | Когда читать |
|-----|------|--------------|
| **Smoke stub** | короткий spec + [`_shared/SMOKE_STUB.md`](_shared/SMOKE_STUB.md) | Достаточно static + context check |
| **Full spec** | `create-event.md`, `game-economy-and-victory.md`, … | Перед строгим behavioral test |

**Регенерация smoke stubs:** `node .cursor/skills/skill-test/_maintain.mjs sync-smoke-specs`

**Шаблон нового full spec:** [`../templates/skill-test-spec.md`](../templates/skill-test-spec.md)

Пути в [`catalog.yaml`](../catalog.yaml) → `spec:`.
