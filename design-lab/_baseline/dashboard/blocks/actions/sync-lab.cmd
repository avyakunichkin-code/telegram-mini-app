@echo off
REM Обход ExecutionPolicy без изменения системных настроек
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-lab.ps1"
exit /b %ERRORLEVEL%
