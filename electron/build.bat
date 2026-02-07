@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo HTApp Electron Build Script
echo ==========================================
echo.

REM Step 1: Copy electron-package.json to package.json
echo [1/5] Setting up package.json...
if exist "electron-package.json" (
    copy /Y "electron-package.json" "package.json" >nul
    echo      - electron-package.json copied to package.json
) else (
    echo ERROR: electron-package.json not found!
    echo Please make sure you exported the project correctly.
    pause
    exit /b 1
)

REM Step 2: Install dependencies
echo [2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

REM Step 3: Rebuild native modules for Electron
echo [3/5] Rebuilding native modules for Electron...
call npm rebuild better-sqlite3 --runtime=electron --target=28.0.0 --disturl=https://electronjs.org/headers --abi=121
if errorlevel 1 (
    echo WARNING: Native module rebuild may have issues, continuing...
)

REM Step 4: Build the Vite app
echo [4/5] Building Vite app...
call npm run build
if errorlevel 1 (
    echo ERROR: Vite build failed!
    pause
    exit /b 1
)

REM Step 5: Build Electron app for Windows
echo [5/5] Building Electron app...
call npx electron-builder --win
if errorlevel 1 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo BUILD SUCCESSFUL!
echo.
echo Your EXE installer is in: release folder
echo ==========================================
echo.
pause
