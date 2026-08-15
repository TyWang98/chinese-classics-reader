@echo off
setlocal
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

rem Reuse the server only when the reader API itself responds.
curl.exe --silent --fail --max-time 1 "http://127.0.0.1:3000/api/works" >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:3000"
  exit /b 0
)

set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"

rem Codex Desktop fallback: useful when its bundled runtime is available but not on PATH.
if not defined NODE_EXE if exist "%UserProfile%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%UserProfile%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not defined NODE_EXE (
  echo Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org/ and open this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules\express\package.json" (
  echo Project dependencies are missing.
  echo In this folder, run: npm install
  pause
  exit /b 1
)

start "Classical Text Reader Server" "%NODE_EXE%" server.js
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
