# Локальное окружение ТВОЙ ХОД (Windows, PowerShell 5.1+). Идемпотентно — можно запускать повторно.
#
# Запуск из корня репозитория (политика выполнения не меняется, Bypass только для этого процесса):
#   powershell -ExecutionPolicy Bypass -File scripts\dev-setup.ps1
#
# Нужно заранее: PostgreSQL 16+ (служба Windows; проверено на 18), Python 3.14 (py -3.14), Node.js.
# PostgreSQL не в стандартной папке: $env:PG_BIN = 'D:\путь\к\PostgreSQL\18\bin' перед запуском.
# Подробно: docs/ops/LOCAL_DEV.md

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend-react'

$DbName = 'tvoy_hod'
$DbUser = 'tvoy_hod'
$DbPass = 'tvoy_hod'
$DbUrl = "postgresql://${DbUser}:${DbPass}@localhost:5432/${DbName}"

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ОШИБКА: $text" -ForegroundColor Red; exit 1 }

# --- 1. Инструменты -----------------------------------------------------------
Step 'Проверка инструментов'
if (-not (Get-Command py -ErrorAction SilentlyContinue)) { Fail 'Python launcher (py) не найден. Установи Python 3.14 с python.org.' }
$ErrorActionPreference = 'Continue'
$pyVer = & py -3.14 --version 2>&1
$pyOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = 'Stop'
if (-not $pyOk) { Fail 'Python 3.14 не найден (py -3.14). Установи с python.org.' }
Write-Host "Python: $pyVer"

if ($env:PG_BIN -and (Test-Path (Join-Path $env:PG_BIN 'psql.exe'))) {
    $env:Path = "$env:PG_BIN;$env:Path"
}
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    $pgBin = Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
        Sort-Object { [int]($_.Name -replace '\D', '') } -Descending |
        ForEach-Object { Join-Path $_.FullName 'bin' } |
        Where-Object { Test-Path (Join-Path $_ 'psql.exe') } |
        Select-Object -First 1
    if (-not $pgBin) { Fail 'psql не найден. Установи PostgreSQL 16+ или укажи папку bin: $env:PG_BIN = ''...\PostgreSQL\18\bin''.' }
    $env:Path = "$pgBin;$env:Path"
    Write-Host "psql: $pgBin (добавлен в PATH этого окна; для постоянного — добавь в PATH пользователя)"
}
Write-Host (& psql --version)

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { Fail 'Node.js/npm не найден.' }
Write-Host "Node: $(& node --version)"

# --- 2. Python venv -----------------------------------------------------------
Step 'Backend: venv на Python 3.14 и зависимости'
$VenvPy = Join-Path $Backend '.venv\Scripts\python.exe'
if (Test-Path $VenvPy) {
    $venvVer = & $VenvPy --version
    if ($venvVer -notlike 'Python 3.14*') {
        Fail "backend\.venv уже есть, но это $venvVer. Удали папку backend\.venv и запусти скрипт снова."
    }
} else {
    & py -3.14 -m venv (Join-Path $Backend '.venv')
}
& $VenvPy -m pip install --upgrade pip --quiet
# Из backend/: путь `-e ../packages/fincore` в requirements.txt pip считает от текущей папки (ADR-016).
Push-Location $Backend
& $VenvPy -m pip install -r 'requirements-dev.txt' --quiet
$pipExit = $LASTEXITCODE
Pop-Location
if ($pipExit -ne 0) { Fail 'pip install завершился с ошибкой.' }
Write-Host 'OK'

# --- 3. Env-файлы ---------------------------------------------------------------
Step 'Env-файлы'
$BackendEnv = Join-Path $Backend '.env'
if (-not (Test-Path $BackendEnv)) {
    $secret = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
    @(
        '# Локальная разработка (создано scripts/dev-setup.ps1). Не коммитится.'
        "DATABASE_URL=$DbUrl"
        "SECRET_KEY=$secret"
        '# id своего пользователя после регистрации — для /api/admin'
        'ADMIN_USER_IDS='
    ) | Set-Content -Path $BackendEnv -Encoding ASCII
    Write-Host 'Создан backend\.env (локальная БД)'
} else {
    $line = Select-String -Path $BackendEnv -Pattern '^\s*DATABASE_URL\s*=' | Select-Object -First 1
    if ($line -and ($line.Line -notmatch 'localhost|127\.0\.0\.1')) {
        Write-Host 'ВНИМАНИЕ: backend\.env указывает DATABASE_URL не на localhost.' -ForegroundColor Yellow
        Write-Host "Для локальной разработки поставь: DATABASE_URL=$DbUrl" -ForegroundColor Yellow
        Fail 'Исправь backend\.env и запусти скрипт снова (файл не перезаписываю).'
    }
    Write-Host 'backend\.env уже есть и смотрит на localhost — оставляю'
}

$FrontendEnv = Join-Path $Frontend '.env.local'
if (-not (Test-Path $FrontendEnv)) {
    @(
        '# Локальная разработка (создано scripts/dev-setup.ps1). Не коммитится.'
        'VITE_API_BASE_URL=http://localhost:8000'
        'VITE_BASE_PATH=/'
    ) | Set-Content -Path $FrontendEnv -Encoding ASCII
    Write-Host 'Создан frontend-react\.env.local'
} else {
    $api = Select-String -Path $FrontendEnv -Pattern '^\s*VITE_API_BASE_URL\s*=' | Select-Object -First 1
    if ($api -and ($api.Line -notmatch 'localhost|127\.0\.0\.1')) {
        Write-Host 'ВНИМАНИЕ: frontend-react\.env.local направляет API не на localhost — dev будет ходить туда.' -ForegroundColor Yellow
    } else {
        Write-Host 'frontend-react\.env.local уже есть — оставляю'
    }
}

# --- 4. База данных -------------------------------------------------------------
Step "PostgreSQL: роль и база $DbName"
$env:PGPASSWORD = $DbPass
# PS 5.1: stderr внешней команды при ErrorActionPreference=Stop превращается в исключение — проверяем мягко
$ErrorActionPreference = 'Continue'
& psql -h localhost -U $DbUser -d $DbName -tAc 'select 1' 2>&1 | Out-Null
$canConnect = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = 'Stop'
if (-not $canConnect) {
    Write-Host "Создаю роль и базу. Нужен пароль суперпользователя postgres (задавался при установке)."
    $sec = Read-Host -AsSecureString 'Пароль postgres'
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
    $roleExists = & psql -h localhost -U postgres -d postgres -tAc "select 1 from pg_roles where rolname='$DbUser'"
    if ($LASTEXITCODE -ne 0) { Fail 'Не удалось подключиться к PostgreSQL как postgres (пароль? служба запущена?).' }
    if ("$roleExists".Trim() -ne '1') {
        & psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=1 -c "create role $DbUser login password '$DbPass'"
    }
    $dbExists = & psql -h localhost -U postgres -d postgres -tAc "select 1 from pg_database where datname='$DbName'"
    if ("$dbExists".Trim() -ne '1') {
        & psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=1 -c "create database $DbName owner $DbUser encoding 'UTF8' template template0"
    }
    $env:PGPASSWORD = $DbPass
}
Write-Host 'OK'

# --- 5. Схема и сиды (как db.sh bootstrap) ---------------------------------------
Step 'Схема (baseline) и сиды'
$hasSchema = & psql -h localhost -U $DbUser -d $DbName -tAc "select to_regclass('public.game_profiles') is not null"
if ("$hasSchema".Trim() -eq 't') {
    Write-Host 'Схема уже есть — baseline пропускаю'
} else {
    & psql -h localhost -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -q -f (Join-Path $Backend 'migrations\0000_schema_baseline.sql')
    if ($LASTEXITCODE -ne 0) { Fail 'baseline не применился.' }
    Write-Host 'Baseline применён'
}
Push-Location $Backend
try {
    $env:PYTHONPATH = $Backend
    $env:DATABASE_URL = $DbUrl
    & $VenvPy (Join-Path $Backend 'scripts\seed_db.py')
    if ($LASTEXITCODE -ne 0) { Fail 'Сиды упали.' }
} finally { Pop-Location }
Remove-Item Env:PGPASSWORD

# --- 6. Frontend ------------------------------------------------------------------
Step 'Frontend: npm install'
Push-Location $Frontend
try {
    & npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Fail 'npm install завершился с ошибкой.' }
} finally { Pop-Location }

Step 'Готово'
Write-Host 'Backend:  cd backend; .\.venv\Scripts\python -m uvicorn main:app --reload --port 8000'
Write-Host 'Frontend: cd frontend-react; npm.cmd run dev   ->  http://localhost:5173/'
