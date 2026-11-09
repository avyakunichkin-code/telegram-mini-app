# А · от ввода к решению · реализация

Основание: владелец после просмотра lab — «Согласен, давай сделаем А».
Дата: 07.11.2026. Approval и адаптации: decision-value-round/APPROVED.md и CANON.md.

## Что работает локально

1. Refine сохраняет несохранённый раздел в sessionStorage этой вкладки:
   пустые границы и поля кредита не теряются после reload. SHA-256 binding
   к сессии, TTL 24ч, checkup id/schema/status validation. Токен в снимок не
   копируется. При изменении серверных строк — явный выбор, без автоперезаписи.
   Отмена правки, PUT+GET, complete, logout/401 и storage-смена сессии очищают
   копию; epoch запрещает позднее воскрешение записи. Storage denied виден.
2. Диапазон дохода/расхода проверяется сервером по одному полю; показаны два
   значения месячного потока при фиксированных остальных входах. Это не
   вероятность и не «процент достоверности». Кандидат по ширине диапазона —
   эвристика, не доказательство максимального влияния.
3. Read-only preview перевода в резерв через fincore month_step/next_snapshot:
   горизонт до 12 месяцев, при нехватке перевод пропущен. Резерв и cash отдельно,
   перевод не увеличивает общие деньги; старые отчёты не перезаписываются.
4. Ожидаемый результат текущего шага и проверка на следующем чекапе. Существующие
   StepActions/история/цели сохранены, лабораторный checkbox не перенесён.
5. Протокол понятности и агрегатор синтетической рубрики. Сессии с людьми не
   проводились. P3-10 admin-воронка остаётся отдельным контрактом: существующие
   события не дают надёжной привязки всех событий к чекапу, её нельзя выдумать.

Контракт POST /api/checkups/{id}/preview описан в SPEC_plan-five-improvements.
Нет миграций, изменений shared fincore, игры, порогов rules_version и деплоя.

## Проверки

| cwd | Команда | Результат |
|---|---|---|
| apps/plan-api | `../../.venv/Scripts/python.exe -m pytest -q` | exit 0, 72 passed, 14.83s |
| apps/plan-web | `npm.cmd run test:unit` | exit 0, 33 passed; финальный прогон после всех правок |
| apps/plan-web | `npm.cmd run build` | exit 0; финальная сборка |
| apps/plan-web | `npm.cmd run test:e2e -- decision-value.spec.js precision.spec.js` | exit 0, 8 passed, mobile-375/desktop |
| root | `node --test scripts/plan-understanding-report.test.mjs` | exit 0, 2 passed |
| root | `node scripts/plan-understanding-report.mjs docs/plan/research/understanding.synthetic.json` | exit 0, human_evidence=false |
| frontend-react | `npm.cmd run check:guardrails` | exit 0, три прежних generated CSS warning |
| frontend-react | `npm.cmd run design-lab:build-nav` | exit 0, хаб 105 ссылок |
| root | scoped `git diff --check` | exit 0, LF/CRLF warning |
| root | `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | не завершён; остановлен после продолжительного обхода дерева без результата, PASS не заявляется |

Критический E2E: edit→revert→reload, пустая граница→reload, конфликт с сервером,
сохранение, выход, complete с ранее несохранённой копией, чувствительность,
перевод/недостаток денег, сброс, отсутствие мутации чекапа и offline disabled.
Последняя правка draft.js после этого E2E добавляет только catch при отказе
доступа к token storage; её проверили расширенным unit и финальной сборкой.

Первый targeted pytest обнаружил неверное имя таблицы в новом тесте (events
вместо product_events); исправлен тест, затем полный Plan pytest зелёный.
Один первый desktop E2E прервался возвратом в мастер во время редактирования
исходников на Vite; повтор на неизменяемых исходниках прошёл все 8. Причина
первого возврата не доказана отдельно; его не выдаём за зелёный прогон.
Sandbox Python-прогон не завершился и остановлен; итоговые Python/API и Chrome
проверки выполнены с разрешёнными локальными портами и тестовой SQLite.

Независимый mqx-ui-reviewer: PASS после исправления отменённого dirty-снимка и
очистки сразу после complete. Backend-вердикт независимого агента не заявляется.
Скриншот mobile приложения просмотрен. Диктор и реальное устройство не проверены.
Развёртывание и юридический gate реальных анкет не закрыты этим срезом.

Ссылки spec/roadmap проверены отдельно — exit 0. Общий conventions checker
запускался в sandbox, затем с разрешением вне sandbox; оба запуска не выдали
результата и остановлены. Его collect_cid_refs обходит ROOT.rglob('*') до
фильтрации node_modules/.venv; причину задержки профилированием не доказывали,
проверяющий скрипт в этот продуктовый срез не меняли.
