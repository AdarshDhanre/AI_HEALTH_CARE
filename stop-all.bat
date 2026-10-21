@echo off
echo ==============================================
echo   Stopping MediCase-AI Services
echo ==============================================

cd /d "%~dp0"

echo Stopping PostgreSQL...
".\tools\pgsql\bin\pg_ctl.exe" -D "database\data" stop

echo Stopping Java backend process...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /T /PID %%a 2>nul

echo Stopping Python AI service...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /T /PID %%a 2>nul

echo Stopping Ayushman OCR service...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /F /T /PID %%a 2>nul

echo Stopping Frontend Vite dev server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /T /PID %%a 2>nul

echo Done. All services stopped.
