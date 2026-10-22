@echo off
echo ==============================================
echo   Starting MediCase-AI Services
echo ==============================================

cd /d "%~dp0"

netstat -ano | findstr :5432 | findstr LISTENING >nul
if errorlevel 1 (
    echo [1/5] Starting PostgreSQL Database [localhost:5432]...
    ".\tools\pgsql\bin\pg_ctl.exe" -D "database\data" -l "database\data\server.log" start
    ping -n 3 127.0.0.1 >nul
) else (
    echo [1/5] PostgreSQL Database is already running.
)

netstat -ano | findstr :8000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [2/5] Starting AI Service [FastAPI :8000]...
    start "MediCase-AI-Python" /d "%~dp0backend-python" cmd /k ".venv\Scripts\python.exe run.py"
    ping -n 3 127.0.0.1 >nul
) else (
    echo [2/5] AI Service is already running.
)

netstat -ano | findstr :8001 | findstr LISTENING >nul
if errorlevel 1 (
    echo [3/5] Starting Ayushman OCR Service [FastAPI :8001]...
    start "MediCase-Ayushman-OCR" /d "%~dp0ayushman_login_system" cmd /k ".venv\Scripts\python.exe run.py"
    ping -n 3 127.0.0.1 >nul
) else (
    echo [3/5] Ayushman OCR Service is already running.
)

netstat -ano | findstr :8080 | findstr LISTENING >nul
if errorlevel 1 (
    echo [4/5] Starting Java Backend [Spring Boot :8080]...
    start "MediCase-Backend-Java" /d "%~dp0backend-java" cmd /k "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev"
    ping -n 4 127.0.0.1 >nul
) else (
    echo [4/5] Java Backend is already running.
)

netstat -ano | findstr :5173 | findstr LISTENING >nul
if errorlevel 1 (
    echo [5/5] Starting Frontend [Vite :5173]...
    start "MediCase-Frontend" /d "%~dp0frontend" cmd /k "npm run dev"
    ping -n 4 127.0.0.1 >nul
) else (
    echo [5/5] Frontend is already running.
)

echo.
echo Waiting for services to initialize...
for /l %%i in (1, 1, 10) do (
    netstat -ano | findstr :5173 | findstr LISTENING >nul
    if not errorlevel 1 goto ready
    ping -n 2 127.0.0.1 >nul
)

:ready
echo.
echo ==============================================
echo All services are active! Opening frontend...
echo   Frontend:     http://localhost:5173
echo   Java Backend: http://localhost:8080
echo   AI Service:   http://localhost:8000
echo   Ayushman OCR: http://127.0.0.1:8001
echo   PostgreSQL:   localhost:5432
echo ==============================================

start http://localhost:5173
