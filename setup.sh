#!/bin/bash

# SylvanGuard - Quick Setup Script for Unix/Linux/macOS
# This script helps set up the development environment

echo ""
echo "========================================"
echo "  SylvanGuard Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js is installed: $(node --version)"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[WARNING] Python is not installed!"
    echo "Python is required for the AI service."
    echo "Please install Python from https://python.org/"
else
    echo "[OK] Python is installed: $(python3 --version)"
fi
echo ""

# Install root dependencies
echo "========================================"
echo "Installing root dependencies..."
echo "========================================"
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install root dependencies"
    exit 1
fi
echo ""

# Install backend dependencies
echo "========================================"
echo "Installing backend dependencies..."
echo "========================================"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install backend dependencies"
    cd ..
    exit 1
fi
cd ..
echo ""

# Install frontend dependencies
echo "========================================"
echo "Installing frontend dependencies..."
echo "========================================"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install frontend dependencies"
    cd ..
    exit 1
fi
cd ..
echo ""

# Setup Python virtual environment (project root)
echo "========================================"
echo "Setting up Python AI service..."
echo "========================================"
if command -v python3 &> /dev/null; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    
    deactivate
    echo "[OK] Python AI service setup complete"
else
    echo "[SKIP] Skipping Python setup (Python not found)"
fi
echo ""

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "========================================"
    echo "Creating backend .env file..."
    echo "========================================"
    cp "backend/.env.example" "backend/.env"
    echo "[OK] Created backend/.env from .env.example"
    echo ""
    echo "[ACTION REQUIRED] Please edit backend/.env and add your Supabase credentials!"
    echo ""
fi

# Make start script executable
chmod +x start-dev.sh

echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Supabase credentials"
echo "2. Run the SQL migration in Supabase (backend/supabase/migrations/001_initial_schema.sql)"
echo "3. Create 'bite-images' bucket in Supabase Storage"
echo "4. Start the development servers:"
echo ""
echo "   Terminal 1:  ./start-dev.sh"
echo "   Terminal 2:  source venv/bin/activate"
echo "                uvicorn api:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "See SETUP_GUIDE.md for detailed instructions."
echo ""
