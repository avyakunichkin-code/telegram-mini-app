# Migration map

Все 26 корневых навыков прочитаны полностью независимым source_audit; назначения объединены в 13 процессов. Полные поля source/purpose/trigger/input/output/write_scope/dependencies/side_effects/transfer/new_location/verification в [skill-migration.json](skill-migration.json). Источники защищены snapshot; слова «adapted» не означают перенос разрешений или runtime-активацию.

| Исходный навык | Новый процесс | Решение |
|---|---|---|
| admin-ops | delivery: admin-ops | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| api-and-interface-design | api-contract-change | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| balance-playtest | balance-playtest | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| code-review-and-quality | review-change | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| create-event | event-authoring | Brief/effects/lifecycle сохранены; taxonomy проверена по loader, stale duplicate extra не переносится. |
| critical-test-scenarios | verify-change | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| db-baselines-and-migrations | db-migration | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| deprecation-and-migration | delivery: deprecation (deferred) | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| design-lab-mqx | mqx-design | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| documentation-and-adrs | architecture-decision / delivery docs | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| doubt-driven-development | review-change: adversarial pass (deferred) | Не обязательный cross-model/CLI; отдельный проход по риску без смены модели. |
| event-analysis | event-audit | Read-only; epilogue exception не переносится без проверки blocks_period_end. |
| frontend-ui-engineering | frontend-implementation | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| game-economy-and-victory | game-economy | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| guidance-onboarding | delivery: guidance | BE/FE mirrors; guidance hook до commit внутри savepoint по коду. |
| idea-refine | delivery: idea | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| incremental-implementation | delivery: implementation | Без generic npm test/tsc, обязательного commit и требования чистого пользовательского дерева. |
| planning-and-task-breakdown | delivery: plan | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| project-handbook-documentation | delivery: handbook | Удалено противоречащее ADR-013/016 требование MVP2 Plan Mode. |
| project-skills-layout | codex-config-audit (meta) | Явная навигация AGENTS; matrix покрывала 24/26, новый map все 26. |
| release-web | delivery: release (deferred) | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| skill-test | codex-config-audit (meta) | Новые Codex checks; Claude report writers не запускать. |
| social-changelog-posts | delivery: marketing (deferred) | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| spec-driven-development | delivery: spec | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| telegram-mini-app-runtime | delivery: TMA (deferred) | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |
| test-driven-development | verify-change / delivery regression | Проектное назначение сохранено, Claude tool/approval syntax не копируется. |

## Остальные элементы

| Источник | Способ / новое место / статус |
|---|---|
| CLAUDE.md, router, catalog, shared workflow/matrix/quality | adapted → AGENTS + CODEX-PROCESSES; discovery отдельно от registry |
| 11 rules | backend/fincore/events/DB → AGENTS + domain skills; frontend/a11y/MQX/lab/canon → UI skills; working-agreements → scoped delivery. Тексты прочитаны; source не меняется |
| 3 agents | adapted → .codex/agents; доступные типы в клиенте наблюдались; отдельный sandbox не обещан |
| settings permissions | not applicable: Claude allow/deny не настройки Codex; managed policy сохранена |
| 5 hook behaviors | adapted/deferred → CODEX-HOOKS matrix; source tests/README прочитаны, originals не запускались |
| launch.json (5 entries) | reference → COMMANDS; py launcher здесь отсутствует, не копировать механически |
| 5 nested frontend skills + slim AGENTS | selected reuse → FRONTEND-REFERENCES; full upstream bodies/rules перечислены и читаются по задаче, не все blanket rules |
| agent-memory | read + selected code validation → CODEX-INVARIANTS; stale и непроверенные утверждения не активированы |
| skill-test checkers/specs/results/templates | listed/side-effect scan; reports/smoke не текущие Codex доказательства; new check.mjs/tests, source запуск запрещён если пишет в .claude |
| Git hooks | 14 *.sample, активного hook нет, core.hooksPath не задан; не изменены. Codex CI/CLI отдельно |
| .github/workflows/ci/deploy/skills-check | fully read, reuse manifest commands; новый codex-check отдельный, ничего не публикует |
| .cursor, .claude/commands, local MCP/override | отсутствуют в обследованных root/frontend каталогах; глобальные credential/config stores не читались |

## Архив — 11, не активировать

- architecture-review: listed, deferred; тело не проверялось, новой discoverable копии нет.
- brainstorm: listed, deferred; тело не проверялось, новой discoverable копии нет.
- create-architecture: listed, deferred; тело не проверялось, новой discoverable копии нет.
- design-review: listed, deferred; тело не проверялось, новой discoverable копии нет.
- design-system: listed, deferred; тело не проверялось, новой discoverable копии нет.
- onboard: listed, deferred; тело не проверялось, новой discoverable копии нет.
- performance-optimization: listed, deferred; тело не проверялось, новой discoverable копии нет.
- retrospective: listed, deferred; тело не проверялось, новой discoverable копии нет.
- team-ui: listed, deferred; тело не проверялось, новой discoverable копии нет.
- ux-design: listed, deferred; тело не проверялось, новой discoverable копии нет.
- ux-review: listed, deferred; тело не проверялось, новой discoverable копии нет.

## Slash-команды

Каждый /<source-skill> соответствует строке таблицы: в Codex вызывай $<target-skill> и стадию/параметры обычным текстом. Например /create-event → $event-authoring; /event-analysis → $event-audit; /balance-playtest → $balance-playtest; /skill-test → $codex-config-audit. Встроенные Claude review/run/simplify заменены $review-change, manifest-командой и доступным browser tool при UI-проверке. Claude Agent/AskUserQuestion/$ARGUMENTS и модельные имена не часть нового контура.

## Происхождение и drift

Для каждого исходного файла SHA-256 в protected-before.json; машинный per-file статус — source-ledger.json. node scripts/codex/check.mjs --protected сравнивает список и bytes, включая добавления/удаления, только локально. CI не сравнивает .git/hooks и пользовательские untracked memory: они не переносимы между checkout. После upstream-изменения прочитай diff источника, пересмотри адаптацию, повтори проверки; не обновляй snapshot, чтобы скрыть drift.
