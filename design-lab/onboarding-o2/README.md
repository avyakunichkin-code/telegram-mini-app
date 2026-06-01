# Design-lab: Onboarding O2 (Progressive Guidance)

**Spec:** [`docs/specs/features/SPEC_onboarding-o2.md`](../docs/specs/features/SPEC_onboarding-o2.md)

**Prod:** `MqxGuidanceStrip` + `GameGuidanceLayer` на `GameScreen` (O1 spotlight снят).

| Раунд | Компонент | Статус |
|-------|-----------|--------|
| [`guidance-strip-round/`](./guidance-strip-round/) | `MqxGuidanceStrip` | **A ★ prod parity** (retroactive) |

**Prod:** `frontend-react/src/components/mqx/guidance/MqxGuidanceStrip.jsx`, `styles/mqx/guidance.css`.

Запуск хаба:

```bash
cd design-lab && npx serve .
```

Отладка раунда:

```powershell
cd design-lab/onboarding-o2/guidance-strip-round
.\sync-lab.sh
npx serve .
```
