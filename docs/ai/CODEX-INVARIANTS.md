# Проверенные ориентиры, а не новая spec

Сверено по текущему коду 2026-10-29; поведенческий тест приложения в этой задаче не запускался. При расхождении следовать коду/тестам и назвать конфликт. Источник повода — .claude/agent-memory/economy-reviewer, память не изменена.

| Утверждение | Проверка в checkout | Статус / ограничение |
|---|---|---|
| Overview/victory используют household_metrics | backend/app/finance/overview_build.py:116–127, victory/snap.py:112–126 | подтверждено чтением; overview with_invest, victory без проекции |
| Истечение статей до backfill в close | backend/app/game/period.py:282–284 | подтверждено чтением |
| Preview имеет gap при истечении всех статей | backend/app/finance/period_close_preview.py, docstring и prepared_household_snapshot + forecast | подтверждено кодом/docstring; тест edge-case не запускался |
| Имена проводок маппятся явно | game/period.py:_TRANSACTION_TYPE_BY_POSTING | подтверждено; старая заметка «строки kind == transaction type» устарела |
| Счётчик выбора пишется choose-path | services/events/choose.py:334, spawn.py:expire_pending_events_for_closed_period | счётчик подтверждён; priority path уже исключает already_shown (spawn.py), старая starvation-заметка не текущий баг; случайный repeat проверять адресно |
| Метрики fincore «только тесты» | overview_build/snap production imports | устаревшую заметку не перенесли |

Прочие заметки needs/stressor/starter matching, страховой commit, run_finale duplication и старый baseline bot bug — гипотезы для адресного ревью, не объявлены вновь проверенными инвариантами. Не переносить их автоматически. До вывода о баге нужен актуальный code path и regression test.
