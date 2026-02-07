# HTApp — offlayn o'quv platformasi (Electron)

Bu loyiha desktop (Electron) uchun mo'ljallangan va ma'lumotlarni lokal SQLite + lokal fayl tizimida saqlaydi.

## Development (lokal)

```sh
npm i
npm run dev
```

> Eslatma: Web preview rejimida Electron API bo'lmagani uchun ba'zi offlayn funksiyalar (SQLite/Storage) ishlamasligi mumkin.

## Desktop build

**Windows:**
```cmd
electron\build.bat
```

**Mac/Linux:**
```bash
chmod +x electron/build.sh
./electron/build.sh
```

## Keyboard shortcutlar
- Admin: Ctrl + Shift + A
- Rahbar: Ctrl + Shift + R

## Ma'lumotlar qayerda saqlanadi?
- Database: Electron userData ichida `htapp.db`
- Fayllar: Electron userData ichida `storage/`
