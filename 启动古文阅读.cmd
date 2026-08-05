@echo off
setlocal
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js with npm was not found on PATH.
  echo Install Node.js LTS from https://nodejs.org/, then reopen this file.
  pause
  exit /b 1
)

start "Classical Text Reader Server" cmd.exe /k "cd /d ""%PROJECT_DIR%"" ^&^& npm start"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
