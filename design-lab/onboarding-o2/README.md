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

## Prod: резерв под полоску на «доске» (2026-11-01)

Пока полоска открыта, скролл вкладки получает снизу отступ высоты полоски (`--mqx-guidance-scroll-pad`), чтобы якорь шага прокручивался над ней. На страницах ★ BG-3 (`mqx-tab-page--board`) этот отступ перебивала «плотность» `board.css` (12px), и на шаге O3 полоска закрывала кнопку «Зарплата». Правило в `design/system/runtime/styles/mqx/guidance.css` усилено вариантом с `--board`; вид полоски и макет раунда не меняются. Регресс закреплён e2e `onboarding.spec.js` / `events.spec.js`.
