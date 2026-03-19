@echo off
echo ==========================================
echo Starting My World Development Environment
echo ==========================================

echo [1/2] Starting Backend Server (Port 3000)...
start "My World Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend Web Server (Port 3001)...
start "My World Web" cmd /k "cd frontend-web && npm run dev"

echo ==========================================
echo Servers are launching in new windows.
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:3001
echo ==========================================
pause
