# GAME / PLAN · общие границы

Карта — [ARCHITECTURE.md](ARCHITECTURE.md), принципы — [CONVENTIONS.md](CONVENTIONS.md).
Поведение: код + тесты → spec → foundation → idea. Backlog — приоритет, аудит — снимок.
Конфликт называй до правки. Сохраняй существующие изменения пользователя.

- GAME: [game/AGENTS.md](game/AGENTS.md). PLAN: [plan/AGENTS.md](plan/AGENTS.md).
  Обычная задача не требует чтения соседнего продукта.
- Общие библиотеки: [shared/packages](shared/packages/AGENTS.md). Продукты не
  импортируют друг друга. fincore — stdlib/Decimal/DTO, без IO/ORM/HTTP и игровых
  понятий. Общий контракт проверяется у реальных потребителей. Данные раздельны.
- Не возвращать save_kind=plan. Перенос каталогов не разрешает реальных пользователей
  или деплой PLAN. Не читать env, credentials, токены, ключи и реальные анкеты.
- Не коммить, не публикуй и не обновляй baseline автоматически.
- Инструкции и справки читать из Codex-контура: `.agents/skills`, `.codex/agents`,
  `docs/engineering` и продуктовых docs. Не читать `historical-agent/**` и `исторический entrypoint`,
  не запускать их скрипты. Исторические source manifests — только provenance.
  Сами исходники не менять и не удалять без отдельного поручения.
- Дизайн следует процессу своего продукта и требует человеческого утверждения.
  Lab-хабы и lab-base.css вручную не редактировать; использовать генераторы.
- Навыки выбирать по задаче; [команды](docs/engineering/COMMANDS.md).
  AI: node scripts/codex/check.mjs и node --test scripts/codex/*.test.mjs.
  Runtime-блокировку не заявлять без наблюдаемого отказа.
- Готовность: согласованный срез, ссылки/контракты, команды с exit code и риски.
  Review: воспроизводимые регрессии с файлом/сценарием/последствием и вердиктом
  PASS / CONCERNS / NEEDS REVISION. Review не разрешает править diff и не заменяет approval.
