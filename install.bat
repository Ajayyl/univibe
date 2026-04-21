@echo off
echo ==============================================
echo Installing Movie Recommendation System Dependencies (Windows)
echo ==============================================

echo [1/2] Installing Node.js Packages...
cd backend
call npm install
cd ..

echo [2/2] Installing Python Packages...
python -m pip install -r requirements.txt

echo.
echo ==============================================
echo Setup Complete! Run start.bat to boot servers
echo ==============================================
pause
