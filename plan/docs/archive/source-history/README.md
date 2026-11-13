# История исходного PLAN-лендинга

`plan-landing.bundle` — полный Git bundle всех refs отдельного репозитория
`https://github.com/avyakunichkin-code/tvoy-plan-landing` на момент переноса.
HEAD: `a27f40cdeb7f2ea7eb066fdb2eb58edaa69186ec`, рабочее дерево было чистым.

Проверка из корня монорепозитория:
`git bundle verify plan/docs/archive/source-history/plan-landing.bundle`.
Для просмотра исходной истории можно клонировать bundle в отдельный каталог.
История сохранена, но не присоединена merge-коммитом: миграция не создаёт коммиты
за владельца. Новые изменения сайта ведутся только в `plan/landing/site`.
