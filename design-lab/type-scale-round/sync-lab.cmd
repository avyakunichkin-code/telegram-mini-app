@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-lab.ps1"
exit /b %ERRORLEVEL%
