# Claude Code hooks (ТВОЙ ХОД)

Конфиг: [`.claude/settings.json`](../settings.json) → `hooks`. Формат и события — [официальная документация](https://code.claude.com/docs/en/hooks).

| Событие | Matcher | Скрипт | Назначение |
|---------|---------|--------|------------|
| `SessionStart` | `startup\|resume\|clear\|compact` | `session-start.mjs` | Краткий указатель на роутер, каталог скиллов, workflow |
| `PreToolUse` | `Edit\|Write\|MultiEdit` | `guard-generated.mjs` | **Гейт:** блокирует ручные правки сгенерированных файлов (см. ниже) |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `after-edit-verify.mjs` | Напоминания pytest / guardrails / sync-lab по пути файла |
| `PreToolUse` (frontmatter агента `economy-reviewer`) | `Edit\|Write\|MultiEdit\|NotebookEdit` | `agent-memory-only.mjs <agent>` | **Гейт:** read-only агент с `memory: project` пишет только в `.claude/agent-memory/<agent>/` |

## Контракт

- Вход — JSON в stdin (`tool_input.file_path` — абсолютный путь; скрипт нормализует `\` → `/`).
- Выход — `{"hookSpecificOutput": {"hookEventName": "...", "additionalContext": "..."}}`. Для `PostToolUse` обычный stdout в контекст **не** попадает — только JSON.
- `SessionStart` / `PostToolUse` **не блокируют** (всегда exit 0): это подсказки. Гейт свода — см. `CONVENTIONS.md` C-Y.
- Блокирующие хуки — `guard-generated.mjs` и `agent-memory-only.mjs` (`PreToolUse`): exit 2 + причина в stderr → Claude Code отменяет вызов и показывает причину модели.
- Throttle: одна подсказка на «корзину» раз в 2 минуты (`.hint-throttle.json`, gitignored).

Требуется `node` в PATH. Изменения `settings.json` подхватываются автоматически; проверить список хуков — `/hooks` в интерактивном `claude`.

Перед релизом: skill **`release-web`** (guardrails + `design-lab:build` + PWA/web smoke) — [`release-web/guardrails.md`](../skills/release-web/guardrails.md).

## Гейт `guard-generated.mjs` (PreToolUse)

| Файл | Почему нельзя руками | Что делать вместо |
|------|----------------------|-------------------|
| `design-lab/index.html` (только корень хаба) | генерируется из `nav.manifest.json` | правка манифеста → `cd frontend-react && npm run design-lab:build-nav` |
| `design-lab/**/lab-base.css` | генерируется `sync-lab` | правка родительских стилей / `styles.css` → `./sync-lab.sh` или `npm run design-lab:sync-round -- design-lab/<тема>/<round>` |
| `backend/migrations/0000_schema_baseline.sql` — только если новый текст содержит DML | baseline = только DDL | данные → `backend/app/seeds/`; backfill → инкремент `00NN_*.sql` |

- Правила-источники: [`rules/design-lab.md`](../rules/design-lab.md), [`rules/db-migrations.md`](../rules/db-migrations.md).
- DML-детектор как в `validate_baseline.sh`: `INSERT|UPDATE|DELETE` в начале строки или после `;`, регистр не важен, `--`-комментарии игнорируются; `ON DELETE CASCADE` не срабатывает. Проверяется `tool_input.content` (Write), `new_string` (Edit), `edits[].new_string` (MultiEdit).
- Раундовые `design-lab/<тема>/<round>/index.html` и `styles.css` **не** блокируются.
- Ограничение: гейт видит только Edit/Write/MultiEdit. Генераторы (`sync-lab.sh`, `design-lab:build-nav`, `dump_schema_baseline.py`) пишут через Bash и не затрагиваются; обход через `sed`/Bash хук тоже не ловит.
- Self-test обоих гейтов (21 кейс, хук гоняется через stdin): `node .claude/hooks/guards.test.mjs`.
- Ручная проверка:

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"design-lab/index.html","old_string":"a","new_string":"b"}}' | node .claude/hooks/guard-generated.mjs; echo "exit=$?"
```
