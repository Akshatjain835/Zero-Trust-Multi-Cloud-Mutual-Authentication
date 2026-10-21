@echo off
title 3-Cloud Zero-Trust Platform Launcher
echo =========================================================
echo   Launching 3-Cloud Zero-Trust Healthcare Platform
echo =========================================================
echo.

echo [1/4] Starting Cloud B (GCP Patient & EHR - Port 5002, mTLS)...
start "Cloud B (GCP EHR - Port 5002)" cmd /k "cd /d ""%~dp0backend\services\cloudB_ehr"" && npm start"
timeout /t 2 /nobreak > nul

echo [2/4] Starting Cloud C (Azure Appointments & Audit - Port 5003, mTLS)...
start "Cloud C (Azure Appointments - Port 5003)" cmd /k "cd /d ""%~dp0backend\services\cloudC_appointments"" && npm start"
timeout /t 2 /nobreak > nul

echo [3/4] Starting Cloud A (AWS Auth & Identity Gateway - Port 5001)...
start "Cloud A (AWS Auth Gateway - Port 5001)" cmd /k "cd /d ""%~dp0backend\services\cloudA_auth"" && npm start"
timeout /t 2 /nobreak > nul

echo [4/4] Starting Web Frontend Dashboard (Port 3000)...
start "Frontend Dashboard (Port 3000)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo =========================================================
echo   All 4 services launched in separate windows!
echo   Open in browser: http://localhost:3000
echo =========================================================
echo.
pause
