# Память экономического ревью: что проверять адресно

Provenance: шесть файлов `source-id:agent-memory/economy-reviewer/*.md` (MEMORY и пять предметных заметок), просмотрены 2026-11-11. Это исторические наблюдения, не перечень текущих багов. Уже подтверждённые ориентиры и ограничения — [CODEX-INVARIANTS](../CODEX-INVARIANTS.md); здесь сохранены уникальные поводы для адресной проверки без повторения его таблицы.

## Что сверено чтением текущего checkout

- [set_point.py](../../../api/app/needs/set_point.py) сортирует активы `order_by(FinanceAsset.id)`: прежняя заметка «нужен ORDER BY» уже устранена. Порядок всё ещё значим при сопоставлении стартовых близнецов.
- [overview_build.py](../../../api/app/finance/overview_build.py) отдаёт `needs_distressed_penalty_estimate=0`. Это не доказывает отсутствие штрафа во всём движке: при изменении UI проверять полный путь, а не обещать штраф из старого текста.
- [choose.py](../../../api/app/services/events/choose.py) записывает selection counter; priority path [spawn.py](../../../api/app/services/events/spawn.py) исключает `already_shown`. Семантика once «выбрано или показано» требует актуального spec и теста, а не молчаливой правки.

Поведенческие тесты в документационной миграции не запускались. Подтверждение чтением не означает воспроизведённую регрессию.

## Сохранённые гипотезы для будущего ревью

| Область | Проверяемый сценарий / вопрос | Исторический источник |
|---|---|---|
| Burn parity | Округление строк против суммы категорий; `legacy_delta` против `lifestyle_extra`; одинаковый backfill в адаптерах | `project_fincore_burn_parity.md` |
| Close / страхование | Есть ли промежуточный commit, и как savepoint failure влияет на ledger/cash_end; journal kind должен маппиться явно | тот же; старое утверждение о равенстве kind/type снято в CODEX-INVARIANTS |
| Preview / expiry | Все статьи истекают перед backfill: покрывает ли parity test именно эту границу? | `project_preview_vs_close_expiry.md` |
| Money metrics | Не появились ли отдельные формулы в run_finale; overview с investment projection и victory без неё сравниваются осознанно; mapping parity не доказывает формулу core | `project_money_metrics_single_source.md` |
| Event repeat | Игнорирование → expiry → random/forced/scheduled spawn; что считают repeat counters? | `project_event_counters_on_choose.md` |
| Needs config | Ошибка parse config при закрытии: не прекращает ли decay; знаки stressors и category_axes overrides | `project_needs_set_point.md` |
| Starter matching | Арендное жильё с нулевым asset_value, но другой арендой: не принимается ли за стартовое; стабильность порядка активов | тот же |
| Habituation | Все места создания FinanceAsset задают acquired_period_index; семантика NULL и миграции | тот же |
| Needs preview | Raw needs_delta против фактического gain_with_headroom в choose/treat-self; literal model против константы | тот же |
| Категории | Нормализация entertainment и mapping housing: совпадают ли эффект, уровень жизни и текст | тот же |
| Fixtures | Есть ли template/needs block в period-close fixture; действительно ли тест проходит needs decay, а не early return | тот же |
| Живые сохранения | Перечитывание blueprint при close: изменение seed модели влияет ли на начатые партии | тот же |
| Balance bot | Старое сообщение о смерти конкретного baseline на p3 не переносится как факт; сравнить реальные действия ботов и пригодность текущего baseline | тот же |

Для вывода о дефекте нужны актуальный call path, воспроизводимый сценарий и regression test. Старые советы про сломанный venv/PYTHONPATH заменить текущим [COMMANDS](../../../../docs/engineering/COMMANDS.md), не ремонтировать окружение по памяти.
