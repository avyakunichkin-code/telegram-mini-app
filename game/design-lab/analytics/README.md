# Design-lab: Аналитика

Вкладка **«Аналитика»**: актуальное утверждение и превью — в [`APPROVED.md`](APPROVED.md).

## AN1 · на утверждение

[Снимок превью на 390 px](an1-mqx-390.png) · [Снимок превью на 320 px](an1-mqx-320.png).

### Интерактивное превью в Windows

Откройте обычный PowerShell или терминал IDE и выполните из папки GAME:

```powershell
npm.cmd --prefix web run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Если зависимости фронтенда ещё не установлены, сначала выполните
`npm.cmd --prefix web ci`. Для AN1 достаточно Vite. Сценарии используют тестовые данные.

Дождитесь строки Vite с адресом `http://127.0.0.1:5173/telegram-mini-app/`
и оставьте терминал открытым. Откройте
[превью AN1](http://127.0.0.1:5173/telegram-mini-app/#/dev/mqx/analytics?revision=an1)
в обычном Edge или Chrome на том же компьютере. Во встроенном браузере Codex
локальный адрес может завершаться тайм-аутом.

При ошибке соединения в обычном браузере проверьте сервер во втором PowerShell:
`(Invoke-WebRequest 'http://127.0.0.1:5173/telegram-mini-app/').StatusCode`.
Работающий сервер возвращает `200`. Если Vite сообщает, что порт занят,
повторите запуск с `--port 5174` и замените порт в обоих адресах.

В превью можно переключить горизонт на 3, 6 и 12 ходов, раскрыть условия
начисления дохода и выбрать сценарий рекомендации.

| Раунд | Статус | Что смотреть |
|-------|--------|--------------|
| [bg2-page-round](bg2-page-round) | **★ prod parity** | `AnalyticsPremium` после ★ BG-2: риск / устойчиво / начало партии |
| [../board-game/screens-round](../board-game/screens-round) | ★ утверждено | экран «Аналитика» в раунде BG-2 |
| [AN1 v2](../archive/analytics-v2-2026-11/) | архив | Раунд 2026-06-21 заменён действующей аналитикой |

Запуск: `cd design-lab && npx serve .` → хаб, или отдельно:

```bash
cd game/design-lab/analytics/bg2-page-round && ./sync-lab.sh && npx serve .
```

Spec: [`SPEC_ANALYTICS`](../../docs/specs/SPEC_ANALYTICS.md).
