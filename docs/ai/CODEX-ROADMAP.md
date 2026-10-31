# Развитие по готовности

Этот roadmap только для AI-архитектуры, не новый продуктовый backlog. Приложение/контент продолжают жить в существующих docs/ROADMAPS, plans и backlog.

| Этап / входной trigger | Работа, артефакт и метрика | Цена поддержки / удаление |
|---|---|---|
| Устойчивый локальный контур | текущие AGENTS/skills/roles/adapter tests; gate native trust + allow/deny/error evidence. Метрика: все checks зелёные, protected diff=0, native status честный | 13 коротких skills + source ledger; не множить конфиги/дубли |
| Калибровка реальными задачами | после нескольких задач с ошибочной маршрутизацией сохранять anonymized request→route→outcome; точечно менять descriptions. Метрика: число неверных primary/лишних чтений и пропущенных проверок уменьшается | новый skill только если повторяющаяся особая процедура не помещается в существующий; убрать после 2 review-циклов без отдельной пользы |
| Pre-Alpha reliability/PostgreSQL | когда соответствующая продуктовая задача взята из текущего плана: isolated PG migration repeat/schema/auth/transaction evidence, release QA profile. Метрика: воспроизводимые failures до prod, critical scenarios covered | QA/release роль расширяется по риску; никаких prod credentials в skill/CI fixtures |
| Баланс/контент | пакет экономических изменений: разнообразие policy/seed/persona, meaningful baseline diff + human playtest. Метрика: обнаруженные regression и объяснимые сдвиги, не процент «APPROVED» | отдельные event/balance роли уже есть; новые роли только при измеримом конфликте ответственности; baseline обновляет человек |
| ПЛАН как продукт | только после действующих gates ADR-016/plan roadmap: отдельный prototype→production профиль с auth/data/ops criteria. Метрика: gate evidence и отсутствие game concepts в ядре | пока компактный процесс; не формировать production-команду/обязательства раньше gate |

## Когда вводить роль, навык или правило

Проблема → повторяющийся trigger → требуемый артефакт → observable метрика. Например роль PG reviewer нужна при реальных migration slices, выдаёт repeat/rollback evidence и измеряется найденными несовместимостями. Skill guidance отделяется от delivery, только если частые задачи теряют mirror/id-migration требования; артефакт BE/FE contract+tests, метрика пропущенных mirror bugs. Rule вводится при повторяемом нарушении, которое можно проверить; regex без доказательств не становится security boundary. Объединять/удалять при исчезновении потребителя, дублировании или измеримом лишнем контексте. Проверять source drift перед каждым изменением AI-слоя, не синхронизировать Claude автоматически.

## Рекомендации приложению/контенту — не реализованы

Проверить актуальность известных preview-expiry edge, транзакций close/insurance, mapping-only parity test, coverage ignored events и представительность balance policies в существующих инженерных задачах. Не менять формулы или число событий этим документом. UI canon обновлять по DESIGN_WORKFLOW; D1–D12 остаются предложениями до spec. Platform/shared guidance/admin/UI-kit не выделять без реального второго потребителя и gates действующего split plan.

## Опциональные интеграции

Сейчас новых plugins/MCP не требуется. При реальной необходимости issue-tracker connector ограничить чтением конкретного проекта для traceability; дизайн-коннектор — только выбранные утверждённые макеты, без обхода lab; browser tooling — локальный synthetic test stand. Перед подключением назвать задачу, данные и минимальный доступ; не подключать аккаунты ради полноты архитектуры.
