# Pre-game shell v2 ★ — оболочки и кнопки MQX

> **★ BG-2 (2026-10-15):** канон и prod — [`APPROVED.md`](APPROVED.md); раунд v2 ниже — история.

**Статус:** исторический раунд v2, [снимок в архиве](../archive/pre-game-shell-v2-2026-11/). Актуальные стартовые экраны — в [реестре дизайна](../../design/system/CURRENT_STYLE.md).
**Спека:** [`game/docs/specs/SPEC_APP_SHELL.md`](../../docs/specs/SPEC_APP_SHELL.md)

Единая система для **до партии**: два route auth, **Монетка B** + TGS-фон, пузырь с хвостом, **без внешней обводки** `mqx-frame` (`mqx-frame--pre-game`), flow flat для new-game, **только `mqx-btn`**.

Архивный снимок сохраняет собранные стили; прежняя сборка использовала
`auth-flow/styles.css`, `new-game-mode/styles.css` и локальные дополнения.

## Запуск исторического снимка

Откройте [архивную витрину](../archive/pre-game-shell-v2-2026-11/index.html).

## Варианты

| ID | Экран | Оболочка |
|----|-------|----------|
| **P1** | Вход `/login` | Bubble + primary CTA |
| **P2** | Регистрация `/register` | Bubble (отдельный route) |
| **P3** | Стартовое меню | Bubble + 3 кнопки (primary / secondary / ghost) |
| **P4** | Новая игра · режим | Flow flat |
| **P5** | Шаблоны | Flow flat |
| **P6** | Проверка сессии | Bubble + TGS + playful copy (как AuthGuard) |

Варианты сохранены в архивной витрине.

## Prod

После ★: `MonetkaBubbleScreen`, `MqxMonetkaDialogScreen`, `MqxButton` — см. `SPEC_APP_SHELL.md` §3.
