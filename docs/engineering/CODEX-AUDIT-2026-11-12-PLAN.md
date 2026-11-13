# Аудит инструкций и доступов PLAN · 2026-11-12

Вердикт: CONCERNS. Аудит из текущего чата с cwd plan; существующие изменения не исправлялись.

## Подтверждено

- В контексте чата присутствуют корневые и PLAN AGENTS.md. Общий маршрут и профиль PLAN существуют; checker проверил ссылки текущего контура.
- Каталог клиента содержит 7 общих repository skills и не содержит 6 игровых repository skills. codex-config-audit прочитан и применён. Это свидетельство доступности, не гарантия автоматического выбора каждого навыка.
- Три GAME agent types присутствуют в схеме инструментов; не запускались и не являются sandbox-изоляцией.
- Managed workspace-write разрешает работу в корне репозитория и plan; чтение файлов и запуск Node фактически работают. Запись этого отчёта проверяет доступ записи в корневой docs/engineering.
- Сеть restricted; расширение permissions/trust не выполнялось. Секреты, env и реальные анкеты не читались. Доступ к внешним сервисам и деплою не проверялся и для этого аудита не требуется.

## Проверки

cwd: Git root, executable: node.

| Команда | Exit | Результат |
|---|---|---|
| node scripts/codex/check.mjs | 0 | 13 skills: root=7, game=6, plan=0, shared=0; 26 mappings; 42 Markdown files; hooks/agents/DDL |
| node --test scripts/codex/*.test.mjs | 1 | 23/24 PASS; scopes.test.mjs:28 получил EPERM при создании Windows junction в sandbox temp |

Тестовый отказ не доказывает дефект discovery: выполнение не дошло до assert. Нужен повтор в среде, разрешающей junction, без ослабления assertions. Adapter smoke, Windows wrapper, patch add/update/delete/move, traversal, unknown mutation payload, error/timeout coverage и runner exit/log tests прошли. Продуктовые suites не запускались: аудит не меняет приложения.

## Нативные hooks

Реализованы и зарегистрированы SessionStart, PreToolUse, PostToolUse в .codex/hooks.json. Trust текущего hash неизвестен; native execution и denied-before-action не подтверждены.

Безопасный runtime probe: Write-Output 'CODEX_GUARD_SMOKE design-lab/index.html' из plan завершился exit 0 и напечатал marker. Локальная политика должна отклонять такую строку; реальный generated-файл не затрагивался. Поэтому считать guard активным нельзя; причину (trust, загрузка слоя, managed policy или иной runtime фактор) этот probe не различает.

Для завершения проверки владелец просматривает конкретный hook source/hash в доступном интерфейсе review/trust, затем в новой сессии проверяет SessionStart, benign allow и безопасный deny. Не менять trust database или managed policy. Официальная документация: https://learn.chatgpt.com/docs/hooks .

## Границы вывода

Для обычной локальной работы PLAN инструкции и базовые доступы присутствуют. Полный PASS не выставлен из-за junction-теста и неподтверждённой нативной активации hooks. Глобальные настройки и пользовательские изменения сохранены.

Повторный прогон "node --test scripts/codex/*.test.mjs" вне Windows sandbox завершился с кодом 0. Прошли все 24 теста, включая создание junction. Результат первоначального прогона выше сохранён как наблюдение среды. Подробности в [отчёте о перепроверке](INDEPENDENT-RUNTIMES.md).
