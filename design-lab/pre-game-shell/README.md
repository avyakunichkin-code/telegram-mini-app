# Pre-game shell v2 ★ — оболочки и кнопки MQX

**Статус:** раунд v2 на утверждение (2026-05-25)  
**Спека:** [`docs/specs/SPEC_APP_SHELL.md`](../../docs/specs/SPEC_APP_SHELL.md)

Единая система для **до партии**: два route auth, **Монетка B** + TGS-фон, пузырь с хвостом, **без внешней обводки** `mqx-frame` (`mqx-frame--pre-game`), flow flat для new-game, **только `mqx-btn`**.

`sync-lab.sh` тянет `auth-flow/styles.css` + `new-game-mode/styles.css` + локальные дополнения.

## Запуск

```powershell
cd design-lab/pre-game-shell
.\sync-lab.sh
npx serve .
```

## Варианты

| ID | Экран | Оболочка |
|----|-------|----------|
| **P1** | Вход `/login` | Bubble + primary CTA |
| **P2** | Регистрация `/register` | Bubble (отдельный route) |
| **P3** | Стартовое меню | Bubble + 3 кнопки (primary / secondary / ghost) |
| **P4** | Новая игра · режим | Flow flat |
| **P5** | Шаблоны | Flow flat |
| **P6** | Проверка сессии | Bubble + TGS + playful copy (как AuthGuard) |

См. [`VARIANTS.md`](VARIANTS.md).

## Prod

После ★: `MonetkaBubbleScreen`, `MqxMonetkaDialogScreen`, `MqxButton` — см. `SPEC_APP_SHELL.md` §3.
