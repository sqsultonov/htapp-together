#!/bin/bash

set -e

echo "=========================================="
echo "HTApp Electron Build Script"
echo "=========================================="
echo ""

# Step 1: Copy electron-package.json to package.json
echo "[1/5] Setting up package.json..."
if [ -f "electron-package.json" ]; then
    cp electron-package.json package.json
    echo "      - electron-package.json copied to package.json"
else
    echo "ERROR: electron-package.json not found!"
    echo "Please make sure you exported the project correctly."
    exit 1
fi

# Step 2: Install dependencies
echo "[2/5] Installing dependencies..."
npm install

# Step 3: Rebuild native modules for Electron
echo "[3/5] Rebuilding native modules for Electron..."
npm rebuild better-sqlite3 --runtime=electron --target=28.0.0 --disturl=https://electronjs.org/headers --abi=121 || echo "WARNING: Native module rebuild may have issues, continuing..."

# Step 4: Build the Vite app
echo "[4/5] Building Vite app..."
npm run build

# Step 5: Build Electron app
echo "[5/5] Building Electron app..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npx electron-builder --mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    npx electron-builder --linux
else
    npx electron-builder --win
fi

echo ""
echo "=========================================="
echo "BUILD SUCCESSFUL!"
echo ""
echo "Your installer is in: release folder"
echo "=========================================="
exit 0
