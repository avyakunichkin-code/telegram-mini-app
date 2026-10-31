---
name: verify-change
description: Select and run meaningful project checks for changed behavior, regressions and critical API/UI scenarios without forcing full suites for documentation.
---

# verify-change

Пример: «проверь изменение API», «добавь регрессию на баг». Не писать зеркальные тесты на опечатку.
Используй [COMMANDS](../../../docs/ai/COMMANDS.md); выбери риск: G1 happy, G2 boundary, G3 контракт, G4 инвариант; N/A объясни. Баг: докажи failing reproduction, затем минимальный fix и regression; не фабрикуй RED, если тест уже зелёный. Backend/fincore: pytest, FE: node --test через manifest, не выдуманный Vitest. UI-сценарий: Playwright/system Chrome. Существенная экономика: дополнительно $balance-playtest. Для AI-контура node scripts/codex/check.mjs и node --test scripts/codex/*.test.mjs; не запускать Claude report writers. Отчёт: cwd/runtime/команда/exit/log, skipped и причина; самооценка не независимая проверка.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
