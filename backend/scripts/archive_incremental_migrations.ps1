#Requires -Version 5.1
<#
.SYNOPSIS
  Move incremental migrations/*.sql (except 0000_*) to migrations/archive/.

.PARAMETER WhatIf
  List files only, no changes.

.PARAMETER Force
  Skip confirmation prompt.

.EXAMPLE
  cd backend
  .\scripts\archive_incremental_migrations.ps1 -WhatIf
  .\scripts\archive_incremental_migrations.ps1 -Force
#>
param(
    [switch]$WhatIf,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$migrationsDir = Join-Path $PSScriptRoot "..\migrations"
$archiveDir = Join-Path $migrationsDir "archive"
$baseline = Join-Path $migrationsDir "0000_schema_baseline.sql"

if (-not (Test-Path $baseline)) {
    Write-Error "Create baseline first: python scripts/dump_schema_baseline.py --from-migrations"
}

if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
}

$candidates = Get-ChildItem -Path $migrationsDir -Filter "*.sql" -File |
    Where-Object { $_.Name -notlike "0000_*" } |
    Sort-Object Name

if ($candidates.Count -eq 0) {
    Write-Host "No incremental migration files to archive."
    exit 0
}

Write-Host "Baseline: 0000_schema_baseline.sql"
Write-Host "Move to archive/: $($candidates.Count) file(s)"
foreach ($f in $candidates) {
    Write-Host "  $($f.Name)"
}

if ($WhatIf) {
    Write-Host "[WhatIf] No changes."
    exit 0
}

if (-not $Force) {
    $confirm = Read-Host "Continue? (y/N)"
    if ($confirm -notmatch '^[yY]') {
        Write-Host "Cancelled."
        exit 0
    }
}

foreach ($f in $candidates) {
    $dest = Join-Path $archiveDir $f.Name
    if (Test-Path $dest) {
        Write-Error "Already exists: $dest"
    }
    Move-Item -Path $f.FullName -Destination $dest
    Write-Host "[archived] $($f.Name)"
}

Write-Host "[OK] migrations/ root: 0000_schema_baseline.sql + new migrations only."
