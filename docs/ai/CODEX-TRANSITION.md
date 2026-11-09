# Переход на Codex — 2026-11-03

Решение владельца: «Проанализируй изменения и давай полностью перейдем на codex».
Codex стал основным процессом разработки в репозитории. Продуктовый код, экономика,
дизайн и границы Game/Plan не менялись. Рабочий вход: [AGENTS](../../AGENTS.md).

## Анализ исходного состояния

Рабочее дерево до работы чистое. Предыдущий срез `fea9af2` добавил 13 навыков,
три роли, адаптеры и отдельный CI рядом с Claude. Он не завершал переход:
CONVENTIONS/README объявляли Claude основной средой; шаблоны использовали старые
команды; навыки событий читали `.claude`; обычный Codex checker требовал каталог
Claude. Исторический аудит описывает состояние 29–30 октября, а не текущий PASS.

## Выполнено

- CONVENTIONS, README и документационный конвейер используют AGENTS и Codex skills.
- Шаблоны idea/spec/plan/task и событий используют действующие маршруты.
- Предметные справки перенесены в [docs/events](../events/event-balance-rules.md).
  Пути и команды адаптированы; устаревшее предупреждение об отсутствии audience
  заменено проверкой текущего loader/spawn. Числа и правила экономики не менялись.
- Старые Claude-процессы в docs/agents помечены историческими; рабочая архитектура
  находится в docs/ai. Предметная навигация Design Lab адаптирована для mqx-design;
  backlog идей дизайна сохранён.
- Claude CI удалён. Codex CI работает на pull_request и push в main.
- Обычный checker не обнаруживает Claude skills; историческая сверка каталога
  доступна через `--source-drift`, байтов — через `--protected`.
- Защищённые Claude-файлы, Git hooks и глобальная конфигурация не изменялись.

## Проверки и границы

Из корня репозитория:

| Проверка | Результат |
|---|---|
| `node scripts/codex/check.mjs` | exit 0 |
| `node --test scripts/codex/*.test.mjs` | exit 0, 14/14; включает executable adapter→stub smoke |
| quick_validate.py для event-authoring и event-audit | exit 0, оба valid |
| `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | exit 0, 6 принципов, 6 записей журнала |
| `node scripts/codex/check.mjs --source-drift` | exit 0 |
| `git diff --check` | exit 0 |
| YAML parse workflow и журнала решений | exit 0 |
| `node scripts/codex/check.mjs --protected` до правок | exit 1, четыре исторических drift ниже |

Исторический snapshot отличается в `CLAUDE.md`,
`.claude/agent-memory/economy-reviewer/project_event_counters_on_choose.md`,
`.claude/hooks/.hint-throttle.json`, `.claude/launch.json`. Это исходные изменения;
снимок не обновлялся. Проверка исходного каталога отделена от обязательного CI.

Повторный безопасный native probe `Write-Output 'CODEX_GUARD_SMOKE design-lab/index.html'`
выполнился с exit 0. Native deny не подтверждён; статус hooks не изменён.
Стандартная активация требует review/trust и наблюдаемого deny-before-action
по [runbook](CODEX-HOOKS.md). Автотест адаптера не доказывает исполнение клиентом.
[Официальная документация](https://learn.chatgpt.com/docs/hooks) также отделяет
конфигурацию hooks от их доверия и исполнения. Вход AGENTS соответствует
[официальной документации AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Серверные required checks GitHub прочитаны 2026-11-03 через `gh api`: обязательны
`Backend pytest`, `Frontend unit + guardrails`, `Game balance diff` (app_id 15368).
`skills` не требуется, поэтому изменения branch protection не нужны и не выполнялись.
Первый запрос из sandbox завершился exit 1 (network); повтор с разрешённым сетевым
доступом — exit 0.
Публикация, push, установка runtime и изменение managed permissions не выполнялись.
Продуктовые тесты не запускались: runtime продукта и данные не затронуты.


## Ограничения редактирования навыков — 2026-11-03

Проверены AGENTS, все проектные SKILL.md, checker, hook/policy и CI.
Guard на синтетическом apply_patch возвращает ALLOW для существующего
`.agents/skills/event-authoring/SKILL.md`, нового `.agents/skills/new-skill/SKILL.md`
и `.codex/hooks.json`; CLAUDE.md отклоняется. Реальные файлы probe не менялись.
Это проверка функции политики, не наблюдение native hooks.

Исправлены искусственные ограничения checker:

- Убрано требование ровно 13 навыков: каталог может расти.
- Проверки исторических migration targets/полей перенесены под `--source-drift`;
  историческая карта не запрещает переименовать или заменить действующий навык.
- Убран безусловный запрет `.codex/config.toml`. Регистрация hooks остаётся
  в hooks.json; добавление дублирующих inline hooks требует предметного review.

Три регрессионных теста моделируют 14-й навык, устаревший migration target
и наличие config.toml без записи в реальные защищённые каталоги.
`node --test scripts/codex/*.test.mjs`: exit 0, 14/14.
`node scripts/codex/check.mjs --source-drift`: exit 0.

Оставшиеся ограничения:

| Слой | Что ограничивает | Значение |
|---|---|---|
| Checker | простое frontmatter name/description, совпадение имени каталога, description 21–1024 символа, отсутствие scaffold и Claude-механизмов, существование Markdown links | локальный формат проекта; не универсальный parser Agent Skills YAML |
| AGENTS / skill workflow | прочитать skill-creator и провалидировать изменённый навык; сохранить продуктовые и UI approval gates | дополнительное approval на каждую правку SKILL.md не требуется |
| Repository policy | запрещена запись в Claude/Cursor/Git и generated lab files | `.agents`/`.codex` не включены в isProtected |
| MCP policy | неизвестные mutating MCP отклоняются независимо от пути | ограничение адаптера инструмента, не запрет менять skills |
| Managed sandbox текущей сессии | `.agents` и `.codex` объявлены read-only | проектные инструкции не могут расширить права; фактический отказ нужно отличать от декларации |
| Native hooks | trust и deny-before-action не наблюдались | наличие регистрации и зелёных тестов не означает активный gate |

Системные/плагинные навыки вне репозитория не изменялись. Глобальные config,
trust stores, env и credentials не читались. Удалять защищённые Claude-источники
или менять managed permissions этим срезом не разрешалось.
