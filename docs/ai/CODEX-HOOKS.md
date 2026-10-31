# Hooks: контракты, доказательства и активация

Единственная регистрация проектного слоя: [.codex/hooks.json](../../.codex/hooks.json). Адаптер [hook.mjs](../../scripts/codex/hook.mjs), политика [policy.mjs](../../scripts/codex/policy.mjs), [тесты](../../scripts/codex/policy.test.mjs). Никаких inline hooks/config.toml, глобальных permissions/trust или Claude override не добавлено.

## Матрица переноса

| Исходное поведение | Новый event/tool | Адаптер и проверка | Реализован | Зарегистрирован | Доверен | Наблюдался runtime | Блокировка подтверждена |
|---|---|---|---|---|---|---|---|
| SessionStart pointer | SessionStart startup/resume | hook session; JSON fixture | да | hooks.json | неизвестно | нет | N/A, hint |
| generated guard | PreToolUse .*; canonical apply_patch/Bash + local exec/file/MCP arguments | policy + hook pre; add/update/delete/move, Windows/traversal, DDL | да | hooks.json | неизвестно | native deny НЕ наблюдался | subprocess stub — да; native — нет |
| after-edit hints/throttle | PostToolUse apply_patch/Edit/Write | hook post; .codex-state/hint-throttle.json | да | hooks.json | неизвестно | нет | N/A, после действия |
| trim-test-output | явный CLI runner, без PostToolUse rewriting | run-check.mjs; длинный лог и exit 7 test | да | намеренно НЕ hook | N/A | локальный subprocess да | N/A, не gate |
| economy-reviewer memory-only | нет автоматической памяти/отдельного sandbox | role contract без записей; техническая изоляция отложена | договор да; guard нет | нет | N/A | нет | нет |

Pre adapter не выдаёт ask/allow overrides: exit 2 + фиксированная причина для deny, exit 0 без вывода для pass. Ошибка/malformed JSON в adapter — exit 2 без payload; это не доказывает fail-closed поведение клиента при timeout/crash самого hook. PostToolUse не откатывает уже выполненную запись. Stop-hook не зарегистрирован, циклы продолжения отсутствуют.

## Payload и границы

Документированный hook payload: tool_name + tool_input; canonical Bash/apply_patch передают command. Дополнительно адаптер понимает фактические доступные schemas exec_command.cmd/workdir, apply_patch raw string/input/patch, file_path/path/notebook_path, multiple edits; structured Move/Rename поддерживает destination/new_path/destination_path, неизвестная схема отклоняется. Patch извлекает все add/update/delete/move targets, проверяет source и destination. Отсутствующий путь у операции записи — ошибка, все mutating MCP без отдельного schema adapter — deny; read/list/get не считаются записью. Symlink/junction ancestors разрешаются перед записью, выход за root запрещён.

Generated: design-lab/index.html и любой design-lab/**/lab-base.css — manual patch/file/write/delete/move deny. Round index.html/styles.css допустимы. Хаб из nav.manifest.json. SQL baseline — консервативный DDL subset: DML/CTE/DO/COPY/CREATE AS SELECT отклоняются; это не полный PostgreSQL parser, ошибки разбора требуют review. Существующий baseline проверяется CLI на целый текст; pre проверяет предлагаемые новые фрагменты, поэтому partial/multi-stage edits не равны проверке итоговой SQL-схемы.

Shell detection — ограниченный guard известных путей, НЕ песочница. Разрешены точные npm(.cmd) run design-lab:build-nav/build из frontend-react и sync-round с одним валидным round path; compound suffix не разрешён. Слово generator ничего не разрешает. Обычные shell-программы могут скрывать запись вычисляемым путём; write_stdin/уже запущенный процесс/внешний MCP/TOCTOU не полностью покрыты. Чтение protected path через shell тоже может блокироваться консервативно; используй адресный file-read. Генераторы доверяют текущим исходникам npm scripts/sync-lab.sh: при их изменении нужен review, не автоматическое доверие названию команды.

## Безопасный smoke и наблюдение

`node --test scripts/codex/*.test.mjs` запускает настоящий Node pre adapter через stdin и выполняет stub только после exit 0. Marker создаётся в отдельной temp-папке; запрещённый target только строка payload, реальные generated-файлы не меняются. Это executable integration adapter→stub, а не нативный Codex hook runtime.

Реальный безопасный probe текущего exec_command: `Write-Output 'CODEX_GUARD_SMOKE design-lab/index.html'` выполнился с exit 0. По политике pre эта строка дала бы deny. Следовательно действие нативной блокировки в текущем чате НЕ подтверждено; нельзя называть guard активным. Это не попытка изменить generated-файл. Реальные raw hook payload/trace текущей managed-сессии недоступны без включённых доверенных hooks; фикстуры не выданы за захваченный runtime.

Наблюдалось отдельно: 13 skills добавились в каталог клиента; 3 custom agent types появились в tool schema. CLI features list показывает hooks=true. Ни это, ни наличие hooks.json не доказывает trust/исполнение.

## Последний шаг активации владельцем

1. Просмотреть diff hooks.json, policy/hook scripts и тестов. Выполнить локальные проверки из COMMANDS.
2. В доступном интерфейсе review/trust hooks Codex проверить конкретный проектный источник; доверять только после просмотра. Не редактировать trust database, не использовать bypass-hook-trust, не менять managed policy. Если политика разрешает только managed hooks — передать reviewed files администратору, не обходить её.
3. Открыть новый чат проекта/перезапустить session при необходимости загрузки. Проверить SessionStart hint, реальный canonical tool_name/tool_input (только synthetic payload) и безопасный smoke выше. Для deny ожидать отказ до tool action, а не отсутствие ошибки в логе.
4. Зафиксировать отдельно trust source/hash, версию клиента, benign allow, denied-before-action и ошибку/timeout. Пока не выполнено — native gate НЕ активен по доказательствам.

Windows commandWindows использует powershell.exe -NoProfile, git-root resolution, затем node с переданным stdin и exit code. Пробелы в root поддержаны; обёртка проверяется fixture. POSIX command использует git-root. Node в PATH обязателен. Команды выполняются из cwd сессии, поэтому путь не зависит от запуска из backend/frontend. Не запускать hooks от имени администратора.

## Страховка CLI/CI

check.mjs проверяет structure/links/map/DDL и локальный protected drift по флагу; CI codex-check запускает checker и executable tests, без публикации. Существующие CI/guardrails не меняются. .git/hooks содержит только sample hooks, активную регистрацию мы не добавляли. Это дополнительная обнаруживающая проверка, не эквивалент превентивной runtime-защите и не доказательство, что generated output нельзя записать через произвольную программу.

Вывод тестов: runner сохраняет полный локальный stdout/stderr в .codex-state/logs, показывает tail и возвращает код процесса; секреты не передавать. Отдельные stdout/stderr ordering и signal→числовой exit не полностью переносимы; signal/spawn failure возвращают 1 с явным статусом. Original after-edit-verify и updatedToolOutput не запускались.

Источники проверены по официальной [документации hooks](https://learn.chatgpt.com/docs/hooks). Клиентские условия сильнее предположений из документации; конфигурация локальная, managed permissions неизменны.
