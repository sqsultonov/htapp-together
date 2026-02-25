# HTApp Electron Desktop Build Guide

## 🚀 BITTA KOMANDA BILAN BUILD (JUDA OSON!)

### 1-qadam: Loyihani yuklab oling
- Git'dan `git clone ...` qiling **yoki** ZIP qilib yuklab oling
- Papkani oching (VSCode tavsiya)

### 2-qadam: BUILD QILING

**Windows:**
```cmd
electron\build.bat
```

**Mac/Linux:**
```bash
chmod +x electron/build.sh
./electron/build.sh
```

### 3-qadam: EXE TAYYOR!
`release/` papkasida tayyor installer:
- `HTApp Setup x.x.x.exe` - O'rnatish uchun
- `win-unpacked/` - Portable versiya

---

## ⚠️ MUHIM: Talablar (Build qilishdan oldin o'rnating!)

### 1. Node.js v18 LTS (MUHIM!)
- https://nodejs.org dan **LTS versiyasini** yuklab oling
- ❌ Node.js v20+ yoki v25+ **ISHLAMAYDI** (prebuilt binary yo'q)
- ✅ Node.js **v18.x LTS** tavsiya etiladi

### 2. Python 3.x
- https://python.org (better-sqlite3 uchun kerak)
- O'rnatishda "Add to PATH" ni tanlang

### 3. Visual Studio Build Tools (KRITIK - Windows uchun)
- https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Visual Studio Installer'da quyidagilarni tanlang:
  - ✅ **"Desktop development with C++"** workload
  - ✅ **"MSVC v143 - VS 2022 C++ x64/x86 build tools"**
  - ✅ **"Windows 10/11 SDK"**
- ~6-7 GB joy talab qiladi

---

## 🔧 Muammolar va yechimlari

### ❌ `better-sqlite3` xatosi
```bash
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
electron\build.bat
```

### ❌ Python topilmadi
```bash
python --version
# Agar ishlamasa, Python'ni https://python.org dan o'rnating
```

### ❌ Build xatosi
```bash
npm cache clean --force
rmdir /s /q node_modules
electron\build.bat
```

---

## ✅ Build muvaffaqiyatli bo'lganini tekshirish

1. `release/HTApp Setup x.x.x.exe` ni ishga tushiring
2. Dasturni o'rnating va oching
3. Test qiling:
   - Admin PIN: **1234** (default)
   - O'qituvchi/O'quvchi yarating
   - Dars va test yarating
   - Fayllarni yuklang

---

## 💾 Ma'lumotlar qayerda saqlanadi?

- **Database:** `%APPDATA%/htapp-electron/htapp.db`
- **Fayllar:** `%APPDATA%/htapp-electron/storage/`
<!-- S.Sultonov -->
