# Plan mode — экраны

**Статус:** активная разработка (MVP 2.0).

## Назначение

- `save_kind: plan` — immutable после создания профиля.
- Мастер ввода базовых параметров и префилл из `starter_params_json` шаблона.
- Спека: evolution §II.3, [`BaseParamsScreen.jsx`](../../components/BaseParamsScreen.jsx) (временно).

## Целевые файлы (по мере готовности)

| Файл | Роль |
|------|------|
| `PlanSetupScreen.jsx` | Оболочка мастера (замена прямого вызова `BaseParamsScreen` из `App.jsx`) |
| `PlanParamsStep.jsx` | Шаги ввода (выделить из монолита `BaseParamsScreen`) |

## Трассировка (черновик)

| Слой | Артефакт |
|------|----------|
| Screen | `screens/plan/PlanSetupScreen.jsx` |
| API | `api/game.js` — старт plan, templates `for_save_kind=plan` |
| Styles | `styles/mqx/flows.css` (pre-game/plan flows) |

## Правило

Новый Plan UI — только здесь, не в корне `components/`.
