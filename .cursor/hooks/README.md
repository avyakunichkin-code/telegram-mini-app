# Cursor hooks (ТВОЙ ХОД)

Конфиг: [`.cursor/hooks.json`](../hooks.json).

| Hook | Скрипт | Назначение |
|------|--------|------------|
| `sessionStart` | `session-start.mjs` | Краткий указатель на router + economy skill |
| `afterFileEdit` | `after-edit-verify.mjs` | Напоминания pytest / guardrails / sync-lab |

Требуется `node` в PATH. После правок `hooks.json` перезагрузите hooks в Cursor (или перезапустите IDE).

Перед релизом вручную или через skill **`release-tma`**: guardrails + `design-lab:build` — см. `tvoy-hod-release-guardrails.mdc`.
