#Requires -Version 5.1
<#
.SYNOPSIS
  Применяет SQL-миграции из backend/migrations/ к БД (без Alembic).

.DESCRIPTION
  Нужны: psql в PATH и переменная DATABASE_URL (postgresql://…).
  Выполняются только *.sql в корне migrations/ (не migrations/archive/).

.PARAMETER BaselineOnly
  Только 0000_schema_baseline.sql — для пустой БД после squash.

.PARAMETER SkipBaseline
  Пропустить 0000_* (legacy: только инкременты на старой БД).

.EXAMPLE
  cd backend
  $env:DATABASE_URL = "postgresql://user:pass@localhost:5432/money_quest"
  .\migrate.ps1
  .\migrate.ps1 -BaselineOnly
#>
param(
    [switch]$BaselineOnly,
    [switch]$SkipBaseline
)

$ErrorActionPreference = "Stop"

if ($BaselineOnly -and $SkipBaseline) {
    Write-Error "Нельзя указать -BaselineOnly и -SkipBaseline одновременно."
}

if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL не задан. Пример: `$env:DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'"
}

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
    Write-Error "psql не найден в PATH. Установите PostgreSQL client (psql) и повторите."
}

$migrationsDir = Join-Path $PSScriptRoot "migrations"
if (-not (Test-Path $migrationsDir)) {
    Write-Error "Каталог миграций не найден: $migrationsDir"
}

$sqlFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" -File | Sort-Object Name
if ($sqlFiles.Count -eq 0) {
    Write-Warning "Нет файлов *.sql в $migrationsDir"
    exit 0
}

$hasBaseline = @($sqlFiles | Where-Object { $_.Name -like "0000_*" }).Count -gt 0
$incrementalCount = @($sqlFiles | Where-Object { $_.Name -notlike "0000_*" }).Count

if ($BaselineOnly) {
    $sqlFiles = @($sqlFiles | Where-Object { $_.Name -like "0000_*" })
    if ($sqlFiles.Count -eq 0) {
        Write-Error "BaselineOnly: файл 0000_schema_baseline.sql не найден. Сгенерируйте: .\scripts\dump_schema_baseline.ps1"
    }
} elseif ($SkipBaseline) {
    $sqlFiles = @($sqlFiles | Where-Object { $_.Name -notlike "0000_*" })
} elseif ($hasBaseline -and $incrementalCount -eq 0) {
    Write-Host "[info] Режим baseline: только 0000_schema_baseline.sql (инкременты в archive/)."
    $sqlFiles = @($sqlFiles | Where-Object { $_.Name -like "0000_*" })
} elseif (-not $hasBaseline) {
    Write-Host "[info] Legacy: 0000_schema_baseline.sql нет — прогон всех инкрементов ($incrementalCount файлов)."
    Write-Host "[info] После squash: scripts/dump_schema_baseline.ps1 + archive_incremental_migrations.ps1"
}

Write-Host "DATABASE_URL: $($env:DATABASE_URL -replace '://[^@]+@', '://***@')"
Write-Host "Миграций к применению: $($sqlFiles.Count)"
Write-Host ""

foreach ($file in $sqlFiles) {
    Write-Host "[migrate] $($file.Name) ..."
    & psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f $file.FullName
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Ошибка при выполнении $($file.Name) (exit $LASTEXITCODE)"
    }
}

Write-Host ""
Write-Host "[OK] Миграции применены. При старте API дополнительно отработает ensure_schema в main.py."
