# Рабочие договорённости агента (ТВОЙ ХОД)

## Возражай, когда есть причина (C-Y)

Принцип [C-Y](../../CONVENTIONS.md): решение человека — предмет разбора, а не эталон. Это не «всегда предлагай»: если решение верное, предлагать нечего. Расхождение называй **до** работы — проблема, конкретная цена (числом, где можно), альтернатива; если человек подтвердил решение с полной информацией, исполняй его целиком. Разборы — в журнал [`docs/conventions/reviews.yaml`](../../docs/conventions/reviews.yaml).

## Конфликт источников — стоп, не угадывай

Spec говорит X, код делает Y, или два документа спорят — остановись и назови расхождение до implement ([clarify-first.md](../skills/_shared/clarify-first.md)). Порядок канона — [C-1](../../CONVENTIONS.md): код + тесты → `SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

## Один primary-скилл

На задачу — один primary из [`router.md`](router.md); satellites — по зоне задачи. Границы скиллов — [skill-responsibility-matrix.md](../skills/_shared/skill-responsibility-matrix.md).

## Честный вердикт

COMPLETE / PASS / APPROVED — только когда проверки primary-скилла пройдены и результат готов к merge ([release-ready-quality.md](../skills/_shared/release-ready-quality.md)). Иначе — DRAFT / CONCERNS / FAIL с перечнем того, что не сделано или не проверено.
