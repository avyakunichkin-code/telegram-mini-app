# Архив инкрементальных миграций

SQL-файлы здесь **не выполняются** `migrate.ps1` (скрипт читает только `migrations/*.sql` в корне папки).

## Зачем

Исторические миграции `0002` … `0043` после **squash** переносятся сюда для аудита и git-blame. Актуальная схема для **пустой** БД поднимается одним файлом:

`migrations/0000_schema_baseline.sql`

## Когда переносить

1. Локально или на staging: все инкременты уже применены **или** baseline актуален.
2. Сгенерировать baseline:
   ```powershell
   python scripts/dump_schema_baseline.py --from-migrations
   ```
   (без `pg_dump` — **models + migrations**; с доступным PostgreSQL — сначала пробует `pg_dump`)
3. Проверка: `python scripts/verify_schema_baseline.py`
4. Пустая PostgreSQL: `.\migrate.ps1 -BaselineOnly`, затем API + pytest.
5. Перенести инкременты: `.\scripts\archive_incremental_migrations.ps1 -Force`
5. Закоммитить `0000_schema_baseline.sql` + изменения в `archive/`.

**Prod с уже применённой историей** — повторно baseline не гонять; только новые `00NN_*.sql` в корне `migrations/`.

## Не путать с

| Путь | Назначение |
|------|------------|
| `docs/balance/baselines/` | JSON-снимки balance playtest |
| `migrations/archive/` | SQL-история схемы (reference) |
