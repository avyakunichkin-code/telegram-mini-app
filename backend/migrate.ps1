#Requires -Version 5.1
<#
.SYNOPSIS
  Применяет SQL-миграции из backend/migrations/ к БД (без Alembic).

.DESCRIPTION
  Нужны: psql в PATH и переменная DATABASE_URL (postgresql://…).
  Файлы *.sql выполняются по имени (0002, 0003, …). Служебные _*.json не трогаются.

.EXAMPLE
  cd backend
  $env:DATABASE_URL = "postgresql://user:pass@localhost:5432/money_quest"
  .\migrate.ps1
#>
$ErrorActionPreference = "Stop"

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
Write-Host "[OK] Все миграции применены. При старте API дополнительно отработает ensure_schema в main.py."
