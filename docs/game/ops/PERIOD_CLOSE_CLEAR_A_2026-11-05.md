---
layer: audit
status: active
last_reviewed: 2026-11-05
---
# Итоги хода · компактный A

Владелец выбрал «Утверждаем А» после сравнения короткого итога и прогноза/
факта. [Решение](../../../design-lab/period-close/clear-result-round/APPROVED.md).
Внедрён MqxPeriodCloseRitual: фактический счёт, изменение «за весь ход»,
ключевые операции и необязательное пояснение. Дублирующие суммы beats
убраны. Проценты по вкладу помечены «Увеличили вклад, не счёт».

`cash_delta` берётся из ответа без перерасчёта: это весь ход, не только
закрытие. `new_balance` не увеличивается на проценты во вклад. Нулевые
highlights не появляются; legacy breakdown сохраняет доходные строки по
прежнему fallback. Минус, просрочка, events_spawn_failed остаются явными.
Подробности содержат также изменения подушки/долгов, если они ненулевые.

GameScreen, механизм первых автопоказов/хвостика и порядок guidance/events/
финала не менялись. DTO/бекенд/экономика не менялись; snapshot прогноза B
не вводился. Onboarding E2E обновлён под явную подпись «За весь ход».
Каталог MqxJuiceCatalogDemo использует полный актуальный пример DTO.
CSS master/export juice.css совпадают. Новый стиль использует токены/rem.

## Проверка

Root `C:/Users/Aleksei Iakunichkin/IdeaProjects/telegram-mini-app`.
Node 24.15.0 / Python 3.13 / системный Chrome. E2E — отдельная SQLite,
тестовый ключ, PYTHON_DOTENV_DISABLED=1; реальные данные не читались.
Логи `.codex-state/close-clear-*`, финальная геометрия — `*-accepted*`.

| cwd | Команда / проверка | Exit | Результат |
|---|---|---:|---|
| frontend-react | `npm.cmd run test:unit` | 0 | Пройдены, включая compact line mapping |
| frontend-react | `npm.cmd run build` | 0 | Собран |
| frontend-react | `npm.cmd run check:guardrails` | 0 | Пройдены; существующие предупреждения Plan actions/history вне среза |
| frontend-react | `npm.cmd run test:e2e -- e2e/period-close-clear.spec.js --output=test-results/close-clear-accepted` | 0 | 8 passed (1.7m), mobile/desktop |
| frontend-react | `npm.cmd run design-lab:build-nav` / `npm.cmd run design-lab:check-rounds` | 0 | 84 ссылки, 47 раундов; параллельные изменения Plan сохранены |
| root | Scoped diff whitespace, локальные ссылки, CSS master/export SHA256 | 0 | Ошибок и расхождений нет |

Новые E2E: compact normal/details в light/dark на 360×640/390×744/desktop;
минус/просрочка/events warning; legacy fallback; реальное закрытие первого
хода с балансом от сервера и debrief без перекрытия CTA. Только DTO в первых
трёх UI-сценариях синтетический; четвёртый использует реальный ответ.

Первый прогон: неверный URL mock закрытия, а также один сетевой timeout;
он не считается PASS. URL исправлен. Первый guardrails указал px в новых
селекторах; заменены токенами/rem. Следующий E2E — 8 passed (1.4m), exit 0.

Визуальный просмотр после этого выявил обрезание сумм справа: ширина
scroll-контейнера с padding превышала ширину карточки при content-box.
Равенство scrollWidth/clientWidth этого не находило. Scoped border-box
исправляет геометрию; regression теперь проверяет bounding boxes самого
контента и каждой денежной строки относительно карточки. Assertions
компактности/прокрутки не ослаблялись. Финальный прогон повторён.

Независимый финальный scoped UI review `first_investment_review`: **PASS**.
Просмотрен accepted normal-390.png: суммы и CTA полностью видны. Canon
синхронизирован, незакрытых воспроизводимых findings нет.

Backend pytest/balance не повторялись: backend/SQL/экономика не менялись.
Экранная клавиатура телефона, screen reader и системный крупный шрифт
вручную не проверены; для длинных предупреждений/details доступна прокрутка.
Production не обновлялся.
