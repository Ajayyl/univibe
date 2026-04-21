@echo off
echo ==============================================
echo Starting Movie Recommendation System Dual-Server Architecture
echo ==============================================

echo [1/2] Booting Python FastAPI Backend on Port 8000
start "Movie Recommendation System - FastAPI Recommendation Engine" cmd /c "cd backend && py -m uvicorn main:app --port 8000 --workers 1"

echo [2/2] Booting Node.js Auth/App Server on Port 3000
start "Movie Recommendation System - Node.js Primary Server" cmd /c "cd backend && node server.js"

echo.
echo ==============================================
echo Servers are online running locally!
echo Open http://localhost:3000 in your browser
echo ==============================================
pause
