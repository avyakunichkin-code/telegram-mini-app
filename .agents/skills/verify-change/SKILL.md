---
name: verify-change
description: Select and run meaningful checks for the selected product or shared contract, scaled to the changed behavior and risk.
---

# verify-change

Определи продукт по путям задачи и [общему маршруту](../../../docs/engineering/CODEX-PROCESSES.md).
Команды бери из его manifests и [COMMANDS](../../../docs/engineering/COMMANDS.md).
Для бага воспроизведи сбой до исправления, когда это возможно; не фабрикуй RED.
Выбери happy/boundary/error/invariant по риску. Документация требует проверки ссылок,
критичный UI — Playwright, API — контракт и потребитель. GAME economy: pytest,
существенное изменение чисел — локальный balance-playtest. Изменение fincore —
тесты ядра и затронутых потребителей, golden и game balance diff по ADR-016.
Изменение только PLAN не требует запуска GAME без общей зависимости.
Для AI: node scripts/codex/check.mjs и node --test scripts/codex/*.test.mjs.
Отчёт: cwd, executable, команда, exit code, результат, skipped и пробелы.
Повторяй проверки после новых изменений/сбоев, а не ради количества запусков.

Общие границы: [AGENTS.md](../../../AGENTS.md).
