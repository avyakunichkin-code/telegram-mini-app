---
layer: audit
status: active
last_reviewed: 2026-11-05
---
# Первое вложение · компактный A

Владелец выбрал A с привычным окном снизу, отклонил подробный чек и затем
утвердил компактный макет ответом «Отлично».
[Решение](../../../design-lab/capital-page/first-investment-round/APPROVED.md).

В пустых «Вложениях» две отдельные кнопки открывают вклад либо облигации.
Раньше общая ссылка называла оба продукта, но открывала только депозит.
Форма содержит ставку, сумму, пресеты, счёт сейчас, остаток и действие.
Подробных расходов/прогноза дохода нет; предупреждение появляется только
при недостатке денег либо остатке ниже расходов. Пороги механик сохранены.

Новый MqxFirstInvestmentSheet использует MqxCapitalSheet: body portal,
выезд снизу, блокировка фона, Escape/scrim/крестик, focus trap и reduced
motion. Обычная форма не выше 400 px; кнопки не меньше 44 px; текст не меньше
12 px. Ошибка POST сохраняет сумму, отправка блокирует повтор и закрытие.

После подтверждённого POST показываются «Детали» с позицией. GET overview
и дополнительные данные запрашиваются независимо. Пока они обновляются,
старый баланс и операции скрыты. При сбое любого GET — существующий
MqxStateError «Покупка выполнена», «Обновить данные» выполняет только GET.
Это исключает ложный пустой портфель и предложение повторить покупку после
подтверждения. Фокус после синхронизации — на «Детали», после ошибки — на
кнопке обновления. Отдельная проблема потерянного ответа на POST этим
срезом не объявляется решённой.

Область: FinancePremium, CapitalDetailsPanel, CapitalActionsPanel,
MqxFirstInvestmentSheet, MQX catalog/demo/export, finance.css master/export,
UX/canon и E2E. Другие финансовые sheets и серверные контракты не менялись.

## Проверки

Root `C:/Users/Aleksei Iakunichkin/IdeaProjects/telegram-mini-app`.
Node 24.15.0, Python 3.13, системный Chrome, изолированная SQLite,
PYTHON_DOTENV_DISABLED=1, тестовые пользователи. Реальные данные не читались.
Логи `.codex-state/first-investment-*`; FE — `*-accepted*`, финальные новые
E2E — `*-confirmed*`.

| cwd | Команда / проверка | Exit | Результат |
|---|---|---:|---|
| frontend-react | `npm.cmd run test:unit` | 0 | Пройдены |
| frontend-react | `npm.cmd run build` | 0 | Собран |
| frontend-react | `npm.cmd run check:guardrails` | 0 | Пройдены; прежнее предупреждение Plan actions-round вне среза |
| frontend-react | `npm.cmd run design-lab:build-nav` / `npm.cmd run design-lab:check-rounds` | 0 | 82 ссылки, 45 раундов |
| frontend-react | `npm.cmd run test:e2e -- e2e/first-investment.spec.js --output=test-results/first-investment-confirmed` | 0 | 10 passed (2.5m), mobile/desktop |
| design-lab/capital-page/first-investment-round | `node verify-sheet.mjs` | 0 | 24 сочетания: compact height, motion, focus, CTA, bottom anchor |
| root | Scoped `git diff --check`, локальные doc links, master/export SHA256 | 0 | Ошибок и расхождений нет |

Сценарии: вклад/облигации из пустого портфеля, все размеры 360×640,
390×744/desktop и light/dark, остаток и фактический debit 10 000 ₽,
невалидная сумма, 503 POST и повтор, focus/keyboard, блокировка закрытия,
одна покупка при повторном submit, 503 GET overview и positions после
успешного POST. Повтор обновляет данные, в БД одна позиция.

Первый runtime-прогон выявил 404.6 px вместо 400: исправлены отступы,
контролы не уменьшались. Независимый review также выявил два stale-refresh
сценария и текст 11 px; оба сценария закрыты, текст поднят до 12 px.
Селектор submit усилен против позднего общего mqx-bg-btn reset: белая
надпись и жирность соответствуют макету; цвет проверяется браузером.

Предыдущий промежуточный E2E: 11 passed / 1 failed (отсоединение формы
во время клика). Источники во время него менялись; причина падения не
объявляется доказанной. Следующий смешанный прогон: 11 passed / 1 failed;
падение mobile overview случилось в подготовке на старом pressGotIt второго
хода, до открытия «Капитала» и установки mock. Runtime в нём не менялся.
Новые тесты теперь готовят реальный первый ход, затем отключают guidance
через API и перезагружают партию: поведение первого вложения больше не
зависит от чтения debrief. Общий fixtures.js не менялся, старая нестабильность
не объявлена исправленной. Оба старых capital.spec.js в смешанном прогоне
прошли; это не выдаётся за зелёный общий frontend E2E.

Независимый scoped UI review `first_investment_review`: **PASS**. Findings
по высоте, refresh-state, размеру текста и canon устранены; новых
воспроизводимых регрессий не найдено. Финальные новые E2E завершены:
10 passed, exit 0. Runtime screenshot 360 px визуально проверен и сохранён
в qa/runtime-deposit-compact-360.png раунда.

Backend/SQL/экономика не менялись: полный pytest и balance не повторялись.
Реальная клавиатура телефона, screen reader и крупный системный шрифт
вручную не проверены. Production не обновлялся.
