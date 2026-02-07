/**
 * =====================================================
 * TUN/KUN REJIMI TOGGLE KOMPONENTI
 * =====================================================
 * 
 * Bu komponent ilovaning tun (dark) va kun (light) rejimini
 * almashtirish uchun ishlatiladi. Butunlay offlayn ishlaydi.
 * 
 * OLIB TASHLASH UCHUN:
 * 1. Ushbu faylni o'chiring: src/components/ui/theme-toggle.tsx
 * 2. src/lib/theme-context.tsx faylini o'chiring
 * 3. App.tsx dan ThemeProvider ni olib tashlang
 * 4. Komponent ishlatilgan joylardan <ThemeToggle /> ni olib tashlang
 * 
 * =====================================================
 */

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg"
      aria-label={theme === "dark" ? "Kun rejimiga o'tish" : "Tun rejimiga o'tish"}
    >
      {/* 
        Tun rejimida: Quyosh ikonkasi (kun rejimiga o'tish uchun)
        Kun rejimida: Oy ikonkasi (tun rejimiga o'tish uchun) 
      */}
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-accent" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" />
      )}
    </Button>
  );
}
