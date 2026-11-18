---
name: review-change
description: Review a scoped diff for reproducible correctness, contract and process regressions in the selected product or shared code.
---

# review-change

Определи продукт и применимые правила через [маршрут](../../../docs/engineering/CODEX-PROCESSES.md).
Получи diff и результаты проверок; не меняй файлы в review. Отмечай новые проблемы
с файлом, сценарием и последствием; проверяй null, повтор, порядок, транзакции,
ошибки сети по риску. Для GAME экономики/UI применяй его локальные инварианты и
MQX approval/canon; для PLAN — его контракт и дизайн. Общий контракт проверяй у
реальных потребителей. Вердикт PASS / CONCERNS / NEEDS REVISION с пробелами.
Независимый проход запускай только когда он нужен и разрешён действующими правилами
клиента. Без него называй результат self-review. Роль и тест не заменяют человека.

Общие границы: [AGENTS.md](../../../AGENTS.md).
