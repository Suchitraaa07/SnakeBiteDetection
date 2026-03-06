#!/bin/bash

# SylvanGuard - Start Development Servers
# This script starts backend and frontend concurrently

echo ""
echo "========================================"
echo "  Starting SylvanGuard Dev Servers"
echo "========================================"
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "[ERROR] backend/.env file not found!"
    echo "Please run ./setup.sh first and configure your environment variables."
    exit 1
fi

echo "[INFO] Starting backend and frontend servers..."
echo "[INFO] Backend will run on http://localhost:5000"
echo "[INFO] Frontend will run on http://localhost:5173"
echo ""
echo "[NOTE] Start Python AI service separately:"
echo "       source venv/bin/activate"
echo "       uvicorn api:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers using concurrently
npm run dev
