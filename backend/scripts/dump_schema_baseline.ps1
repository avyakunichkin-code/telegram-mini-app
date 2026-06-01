#Requires -Version 5.1
<#
.SYNOPSIS
  Снимает DDL текущей БД в migrations/0000_schema_baseline.sql (pg_dump --schema-only).

.DESCRIPTION
  Нужны: psql/pg_dump в PATH и DATABASE_URL на БД, где уже применены все инкрементальные миграции.
  Baseline — только схема (таблицы, индексы, constraints). Данные и seeds — main.py + YAML при старте API.

.EXAMPLE
  cd backend
  $env:DATABASE_URL = "postgresql://user:pass@localhost:5432/money_quest"
  .\scripts\dump_schema_baseline.ps1
#>
$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL не задан."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error "pg_dump не найден в PATH (PostgreSQL client)."
}

$outFile = Join-Path $PSScriptRoot "..\migrations\0000_schema_baseline.sql"
$stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")

$header = @"
-- Schema baseline: ТВОЙ ХОД (PostgreSQL)
-- Generated: $stamp
-- Regenerate: backend/scripts/dump_schema_baseline.ps1
-- Apply empty DB only: backend/migrate.ps1 -BaselineOnly
--
-- DDL only. Reference data: main.py seeds + data/events/mvp11 YAML sync.
--

"@

Write-Host "Dump schema-only -> $outFile"
$dump = & pg_dump "$env:DATABASE_URL" --schema-only --no-owner --no-privileges --no-tablespaces 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "pg_dump unavailable or failed — fallback to Python (models + migrations)."
    python (Join-Path $PSScriptRoot "dump_schema_baseline.py") --from-migrations
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    exit 0
}

Set-Content -Path $outFile -Value ($header + ($dump -join "`n")) -Encoding utf8NoBOM
Write-Host "[OK] Baseline written ($((Get-Item $outFile).Length) bytes)"
Write-Host "Next: test on empty DB, then optional archive_incremental_migrations.ps1"
