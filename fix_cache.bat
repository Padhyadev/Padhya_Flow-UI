@echo off
echo ========================================
echo CLEARING ALL CACHES - Property Update Fix
echo ========================================
echo.

echo [1/5] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Deleting build cache folders...
if exist build rmdir /S /Q build
if exist node_modules\.cache rmdir /S /Q node_modules\.cache
if exist .parcel-cache rmdir /S /Q .parcel-cache

echo [3/5] Clearing npm cache...
call npm cache clean --force

echo [4/5] Starting development server...
start cmd /k "npm start"

echo.
echo ========================================
echo DONE! Wait for server to start, then:
echo 1. Close ALL browser tabs
echo 2. Press Ctrl+Shift+Delete in browser
echo 3. Clear "Cached images and files"
echo 4. Open NEW tab and go to app
echo ========================================
echo.
echo Look for this in console:
echo   "PROPERTY API [v2]: Using /Properties/Add"
echo.
pause
