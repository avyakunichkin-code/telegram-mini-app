# Claude Code hooks (ТВОЙ ХОД)

Конфиг: [`.claude/settings.json`](../settings.json) → `hooks`. Формат и события — [официальная документация](https://code.claude.com/docs/en/hooks).

| Событие | Matcher | Скрипт | Назначение |
|---------|---------|--------|------------|
| `SessionStart` | `startup\|resume\|clear\|compact` | `session-start.mjs` | Краткий указатель на роутер, каталог скиллов, workflow |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `after-edit-verify.mjs` | Напоминания pytest / guardrails / sync-lab по пути файла |

## Контракт

- Вход — JSON в stdin (`tool_input.file_path` — абсолютный путь; скрипт нормализует `\` → `/`).
- Выход — `{"hookSpecificOutput": {"hookEventName": "...", "additionalContext": "..."}}`. Для `PostToolUse` обычный stdout в контекст **не** попадает — только JSON.
- Хуки **не блокируют** (всегда exit 0): это подсказки, не гейты. Гейт свода — см. `CONVENTIONS.md` C-Y.
- Throttle: одна подсказка на «корзину» раз в 2 минуты (`.hint-throttle.json`, gitignored).

Требуется `node` в PATH. Изменения `settings.json` подхватываются автоматически; проверить список хуков — `/hooks` в интерактивном `claude`.

Перед релизом: skill **`release-web`** (guardrails + `design-lab:build` + PWA/web smoke) — [`release-web/guardrails.md`](../skills/release-web/guardrails.md).
