@echo off
rem start-dev.bat
rem Launch backend and frontend in separate cmd windows (Windows-friendly)

setlocal enabledelayedexpansion
set ROOT=%~dp0

echo Launching backend in new window...
start "Backend" cmd /k "cd /d "%ROOT%backend" ^&^& if not exist .venv\Scripts\activate.bat (echo Creating Python virtualenv && python -m venv .venv && call .venv\Scripts\activate.bat ^&^& if exist requirements.txt (pip install -r requirements.txt)) else (call .venv\Scripts\activate.bat) ^&^& echo Starting uvicorn... ^&^& uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Launching frontend in new window...
start "Frontend" cmd /k "cd /d "%ROOT%crisis-dashboard" ^&^& if not exist node_modules (echo Installing npm deps && npm ci) else (echo node_modules present) ^&^& echo Starting vite dev server... ^&^& npm run dev"

echo Launched backend and frontend windows.
endlocal
