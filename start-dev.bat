@echo off
REM SylvanGuard - Start Development Servers
REM This script starts backend and frontend concurrently

echo.
echo ========================================
echo   Starting SylvanGuard Dev Servers
echo ========================================
echo.

REM Check if backend .env exists
if not exist "backend\.env" (
    echo [ERROR] backend\.env file not found!
    echo Please run setup.bat first and configure your environment variables.
    pause
    exit /b 1
)

echo [INFO] Starting backend and frontend servers...
echo [INFO] Backend will run on http://localhost:5000
echo [INFO] Frontend will run on http://localhost:5173
echo.
echo [NOTE] Start Python AI service separately:
echo        venv\Scripts\activate
echo        uvicorn api:app --reload --host 0.0.0.0 --port 8000
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start both servers using concurrently
call npm run dev
