---
name: game-economy
description: Change game salary, period rules, needs, victory, starter data or thresholds with invariant checks and scoped balance evidence.
---

# game-economy

Примеры: «зарплата 20000 → 30000», «порог victory», «ошибка fincore». Не primary: сюжет YAML, CSS, README.
Прочитай [инварианты](../../../docs/ai/CODEX-INVARIANTS.md), spec изменяемой механики, backend/app/game/period.py и victory/engine.py по области. Назови игроко-видимое изменение до кода, проверь шаблоны, идемпотентность seeds и текущие сохранения. Для fincore следуй ADR-016: только нейтральные DTO/месяцы/финансы, адаптеры в игре. Подтверди формулу backend pytest (включает fincore); перенос расчёта требует golden и balance diff = 0. Существенная смена чисел → $balance-playtest с интерпретацией метрик, не только «тест зелёный». После крупного diff отдельный economy-reviewer; баланс не доказывает корректность формулы.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
