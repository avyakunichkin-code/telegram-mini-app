# Проверка реализации · 06.11.2026

Область: утверждённая главная «Игровой пульт А», desktop sidebar, реальные потребности/цели/действия/окна. Обновлённый счёт в hero, полный G1, стабильные зарплатный билет и место подсказки. Старые current-page-round и complete-game-round сохранены. Backend/economy/DTO не изменялись.

## Команды и результаты

Все команды из frontend-react, кроме явно указанных root. Node 24.15, системный Chrome; backend E2E — корневая .venv Python, временная SQLite и автоматически выбранные локальные порты.

| Проверка | Exit | Результат |
|---|---|---|
| npm.cmd run test:unit | 0 | utils, MQX, screen, guidance, scripts |
| npm.cmd run build | 0 | Vite + PWA; известные предупреждения chunk size, смешанного dynamic/static API import и возраста Browserslist |
| npm.cmd run check:guardrails | 0 | boundaries, quarantine, canon, finance/events parity, style discipline, ratchet, rounds |
| npm.cmd run design-lab:build | 0 | native Pocket canonical page → generated dashboard parity → navigator |
| node scripts/build-pocket-page-round.mjs | 0 | native ready/paid/risk/large; stable salary height and needs position; no component overflow at 320/390/1440 |
| node scripts/run-pocket-e2e.mjs | 0 | pocket-board + onboarding + keyboard: 9 passed, 1 штатно skipped (mobile keyboard) |
| node scripts/run-pocket-e2e.mjs e2e/events.spec.js e2e/offline.spec.js | 1 | 7 passed, 1 mobile events failed before event at guidance debrief «Понятно» |
| node scripts/run-pocket-e2e.mjs e2e/events.spec.js --project=mobile-chrome --grep 'варианты видны' | 0 | Изолированный повтор того же сценария: 1 passed |
| root: .venv/Scripts/python.exe scripts/check_conventions.py | 0 | 6 principles, conventions gate passed |
| root: node scripts/design-assets.mjs --check | 0 | 191 exports, 0 stale |
| root: git diff --check (scoped files) | 0 | нет ошибок пробелов |

Логи основных команд: `.codex-state/pocket-unit-final.log`, `pocket-build-final.log`, `pocket-guardrails-final.log`, `pocket-lab-final.log`. Снимки native React: `qa/`. Сквозные тесты зарплаты измеряют координаты внутри scroll-root (онбординг намеренно прокручивает страницу), высоту билетов и блока подсказки до/после выплаты. Зарплата меняется через настоящий API; первый ход проходит через существующее обучение, подушку и итоги.

## Review и ограничения

Независимый mqx-ui-reviewer запущен по требованию frontend-implementation. До завершения сообщил о двух проблемах: узкая MQX-витрина при desktop breakpoint и пропуск базового класса у зарплатной кнопки. Оба исправлены, дополнены browser overflow-checks. Итоговый независимый вердикт не получен: агент завершился из-за лимита использования. Самопроверка не выдана за независимый PASS.

Остаётся нестабильность существующего E2E helper: быстрый «Понятно» в debrief иногда не продвигает шаг; изолированный повтор прошёл. Это не было молча исправлено изменением игрового curriculum. Три прежних предупреждения lab-base.css в plan-checkup сохранены. Публикация/деплой/коммит не выполнялись.
