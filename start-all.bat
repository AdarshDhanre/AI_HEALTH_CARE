@echo off
echo ==============================================
echo   Starting MediCase-AI Services
echo ==============================================

cd /d "%~dp0"

netstat -ano | findstr :5432 >nul
if errorlevel 1 (
    echo [1/4] Starting PostgreSQL Database (localhost:5432)...
    ".\tools\pgsql\bin\pg_ctl.exe" -D "database\data" -l "database\data\server.log" start
    timeout /t 2 /nobreak >nul
) else (
    echo [1/4] PostgreSQL Database is already running.
)

netstat -ano | findstr :8000 >nul
if errorlevel 1 (
    echo [2/4] Starting AI Service (FastAPI :8000)...
    start "MediCase-AI-Python" cmd /k "cd /d "%~dp0backend-python" && .venv\Scripts\uvicorn.exe app.main:app --port 8000"
    timeout /t 2 /nobreak >nul
) else (
    echo [2/4] AI Service is already running.
)

netstat -ano | findstr :8080 >nul
if errorlevel 1 (
    echo [3/4] Starting Java Backend (Spring Boot :8080)...
    start "MediCase-Backend-Java" cmd /k "cd /d "%~dp0backend-java" && .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev""
    timeout /t 3 /nobreak >nul
) else (
    echo [3/4] Java Backend is already running.
)

netstat -ano | findstr :5173 >nul
if errorlevel 1 (
    echo [4/4] Starting Frontend (Vite :5173)...
    start "MediCase-Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
    timeout /t 2 /nobreak >nul
) else (
    echo [4/4] Frontend is already running.
)

echo.
echo ==============================================
echo All services are active! Opening frontend...
echo   Frontend:     http://localhost:5173
echo   Java Backend: http://localhost:8080
echo   AI Service:   http://localhost:8000
echo   PostgreSQL:   localhost:5432
echo ==============================================

start http://localhost:5173
