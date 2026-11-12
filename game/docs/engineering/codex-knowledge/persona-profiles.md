# Персоны для авторинга событий

Источник: исторический `source-id:skills/create-event/persona-profiles.md`, перенесён 2026-11-11. Числа старта не дублируются: канон — [game_starter_templates.py](../../../api/app/seeds/game_starter_templates.py). Это справка о тоне и выборе аудитории; [spec](../../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md), loader и тесты определяют доступные поля.

| Шаблон | Тон сюжета | Обычно значимые оси | Темы |
|---|---|---|---|
| `mq_game_basic_v1` — Студент | Учёба, общага/съём, подработка, друзья, деньги до зарплаты | social/health, затем comfort/status | consumption, health, social_family, investment_education, income_work |
| `mq_game_tight_budget_v1` — Профессионал | Карьера, аренда, машина, кредит, нехватка времени | status/comfort, затем social/health | consumption, auto, housing, credit_debt, insurance |
| `mq_game_mortgage_stress_v1` | Семья и ипотечная нагрузка | По конкретному сюжету | housing, instrumental |
| `mq_game_debt_stack_v1` | Нагрузка нескольких обязательств | По конкретному сюжету | credit_debt |

Оси — ориентир копирайта, не веса для механического умножения эффектов. Проверять наличие template_key в текущем seed; финансовые цены/остатки и initial needs читать там же.

`audience_template_keys` отвечает, кому показывать историю; prerequisites — за инструментальные условия (актив, полис, период и т.п.). `content_class` описывает тип сюжета. Не заменять audience наличием автомобиля и не копировать старое предположение «audience filter может отсутствовать» без проверки текущего движка.

Если одинаковая механика имеет разный текст для студента и профессионала, делать отдельные definition keys и audience; исторический ориентир — пара universal. Ролевые сюжеты разной формы (одногруппники против коллег) — профильный контент. Не создавать `variants[]` вместо отдельных определений.

Перед сдачей сверить реальные `impacts` для каждой аудитории, включая проценты зарплаты и burn. Правила цены, повторов и тематических осей — [event-balance-rules.md](event-balance-rules.md).
