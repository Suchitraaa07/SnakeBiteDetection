@echo off
REM SylvanGuard - Quick Setup Script for Windows
REM This script helps set up the development environment

echo.
echo ========================================
echo   SylvanGuard Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node --version
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python is not installed!
    echo Python is required for the AI service.
    echo Please install Python from https://python.org/
) else (
    echo [OK] Python is installed:
    python --version
)
echo.

REM Install root dependencies
echo ========================================
echo Installing root dependencies...
echo ========================================
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)
echo.

REM Install backend dependencies
echo ========================================
echo Installing backend dependencies...
echo ========================================
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Install frontend dependencies
echo ========================================
echo Installing frontend dependencies...
echo ========================================
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Setup Python virtual environment (project root)
echo ========================================
echo Setting up Python AI service...
echo ========================================
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Creating virtual environment...
    python -m venv venv
    
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    
    echo Installing Python dependencies...
    pip install -r requirements.txt
    
    call venv\Scripts\deactivate.bat
    echo [OK] Python AI service setup complete
) else (
    echo [SKIP] Skipping Python setup (Python not found)
)
echo.

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo ========================================
    echo Creating backend .env file...
    echo ========================================
    copy "backend\.env.example" "backend\.env"
    echo [OK] Created backend\.env from .env.example
    echo.
    echo [ACTION REQUIRED] Please edit backend\.env and add your Supabase credentials!
    echo.
)

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your Supabase credentials
echo 2. Run the SQL migration in Supabase (backend\supabase\migrations\001_initial_schema.sql)
echo 3. Create 'bite-images' bucket in Supabase Storage
echo 4. Start the development servers:
echo.
echo    Terminal 1:  npm run dev
echo    Terminal 2:  venv\Scripts\activate
echo                 uvicorn api:app --reload --host 0.0.0.0 --port 8000
echo.
echo See SETUP_GUIDE.md for detailed instructions.
echo.
pause
