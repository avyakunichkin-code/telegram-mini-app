---
layer: audit
status: draft
last_reviewed: 2026-11-06
---
# Разнообразие событий: локальный кандидат

Продолжение [исправления отбора](EVENT_WEIGHT_SELECTION_2026-11-05.md).
После поручения «Продолжай» сохранён правильный weighted sampling,
приостановлено cash-only «погашение» карты предпринимателя, курсу добавлен
cooldown6, семейному отпуску — платный короткий отдых без будущих платежей.
Числа целей, зарплаты и стартовые условия не менялись. Активных definitions
теперь71;72 в первоначальном аудите — снимок до калибровки.

Backend: **709passed,564.23s,exit0**. Targeted: **33passed,exit0**.
Логи `.codex-state/events-recalibration-backend.log` и
`events-recalibration-targeted.log`; команды из backend, Python3.13,
dotenv disabled, временная SQLite и синтетические данные.

Фактический YAML: весь manifest11×40,seed42, **exit1**;
10 REGRESSION LIKELY,1 NEEDS REVIEW; suite invariants без нарушений.
Все11 наборов metadata совпадают. Полный отчёт [ресурс](../../balance/reports/events-recalibration-review-2026-11-05.md)
содержит сравнение и с принятыми эталонами, и с исправлением отбора до калибровки.
Победы chain_runner Student/Pro/Manager/Entrepreneur: P18/P19/P19/P24.
Предприниматель restructure снова доживает до40 вместо пораженияP37.

Это **NEEDS REVISION относительно принятых эталонов**, а не готовый релиз.
В shadow-проверке seed7 остаётся поражениеP38; seed99 — победаP25.
Эти дополнительные seed не имеют парного контроля и не доказывают общий баланс.
Baselines не менялись; человеческое принятие баланса не получено.
Существующие pending-карточки карты сохраняют прежнюю семантику;
приостановка блокирует новые появления, не исправляет старые ответы задним числом.
SQL, API, frontend и production этим срезом не менялись.
