# Перенос знаний в Codex

Состояние на 2026-11-11: рабочие процессы используют AGENTS, .agents/skills, .codex/agents, scripts/codex и текущую документацию. Снятый контур не читается и не изменялся. Исторические свидетельства сохранены в [архиве](../archive/agent-migration-2026-11-11/README.md); их исходные пути не являются зависимостями выполнения.

## Где сохранены знания

| Предмет | Рабочий источник |
|---|---|
| Баланс choices, lifecycle и тематические axes | [Баланс событий](../../game/docs/engineering/codex-knowledge/event-balance-rules.md) |
| Аудитория и тон событий | [Персоны](../../game/docs/engineering/codex-knowledge/persona-profiles.md) |
| Подтверждённые ориентиры и исторические гипотезы ревью | [Заметки ревью](../../game/docs/engineering/codex-knowledge/reviewer-notes.md), [инварианты](../../game/docs/engineering/CODEX-INVARIANTS.md) |
| Non-ORM схема, assets, guidance/admin review questions | [Инженерные детали](../../game/docs/engineering/codex-knowledge/engineering-notes.md) |
| Рабочие процессы | [CODEX-PROCESSES](CODEX-PROCESSES.md), [каталог навыков](../agents/AGENT_SKILLS.md) |
| React/Vite и ограничения применимости | [FRONTEND-REFERENCES](FRONTEND-REFERENCES.md) |
| Карта 26 исходных процессов → текущие навыки | [skill-migration.json](skill-migration.json), [пояснение](CODEX-MIGRATION-MAP.md) |

Для Plan уникальная предметная справка в исходном наборе не обнаружена; Game-знания туда не копировались. Код/tests выше справок; старые числа и memory claims не повышены до текущей spec. Поимённые оригиналы, hashes и история перенаправлений сохранены в архиве, без переписывания свидетельств.

## Исправления после ревью

- Прямые инструкции чтения, команды PowerShell, reference-links и encoded paths проверяются вместе с обычными ссылками. Windows-пути контекста нормализуются.
- AI CI запускается для любого Markdown, а также для навыков, ролей и адаптеров. Тест проверяет полноту Markdown-триггеров обоих workflow.
- Рабочие docs, шаблоны, source-id и названия используют текущий контур. Сохранённая карта процессов не требует наличия исходных файлов.
- Checker не вычисляет прежний protected snapshot. --protected — явно обозначенный совместимый alias текущей проверки.
- Политика защищает неразрешённые скрытые каталоги и сторонние root-entrypoints по общему правилу; тесты используют синтетические примеры. Git metadata и generated lab output остаются защищены.
- Комментарии generated CSS и parity HTML обновлены штатными генераторами из исправленных источников. Layout, финансовые формулы и API не менялись.

## Проверки

- Codex checker: exit 0; 13 навыков, 26 mappings, локальные ссылки и зависимости.
- Node adapter/regression tests: 18/18, exit 0, включая reference-links, plain readers, encoded/Windows paths, CI triggers и отказ доступа к синтетическому снятому контуру.
- Conventions: exit 0. quick_validate двух изменённых навыков: каждый exit 0.
- Product roots/navigation: exit 0. Lab rounds из game/web: exit 0 (39 sync-lab dirs, parity/canon).
- Шесть CSS rounds и Dashboard parity пересобраны генераторами, exit 0. Git Bash потребовал штатного разрешения запуска вне sandbox; отказа автоматического review не было.

Первый lab-check из корня искал результаты в неверном cwd и завершился 1; повтор из game/web прошёл. Промежуточные ошибки новых тестов исправлены перед итоговым прогоном. Product backend/FE suites не запускались: этот срез не меняет продуктовую логику. Runtime-активация клиентских hooks и GitHub run не заявляются. Коммитов и публикации нет.
