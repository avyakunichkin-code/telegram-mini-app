---
name: review-change
description: Review a scoped diff for reproducible correctness, contract and project-process regressions; supports separate economy, balance and MQX passes.
---

# review-change

Пример: «проверь diff перед merge». Не primary: написать фичу.
Прочитай [роли](../../../docs/ai/CODEX-ARCHITECTURE.md); получи diff и результаты проверок, не меняй файлы. Проверяй только новые actionable проблемы с file/scenario/consequence. Существенный риск → adversarial pass: null, повтор, порядок, транзакции, проигнорированное событие, ошибка сети. Economy-reviewer требует зелёного backend pytest для логики/данных; economy-balance-runner сравнивает симуляцию, не код; mqx-ui-reviewer сверяет размер изменения и lab/prod/canon/человеческое approval. Делегируй только при разрешении клиента и необходимости изоляции; передай минимальный контекст, не готовый ответ. Нет независимого запуска — честно назови self-review. Verdict PASS/CONCERNS/NEEDS REVISION с проверками и пробелами.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
