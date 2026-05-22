# Design-lab: Имя и сценарий (шаг 2)

```bash
cd design-lab/game-templates
npx serve .
```

**T2 ★ Strips + SI1** — в prod (`MqxStarterScenarioPicker`).

| Документ | Назначение |
|----------|------------|
| [`VARIANTS.md`](VARIANTS.md) | T1–T4, SI1–SI3 |
| [`../new-game-mode/`](../new-game-mode/) | Шаг 1 — режим |

## Prod

- `GameTemplatePickScreen` + `MqxStarterScenarioPicker`
- API: `highlights`, `scenario_icon`, `compare_note` на `GET /api/game/templates`
