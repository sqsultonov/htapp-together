/**
 * =====================================================
 * TUN/KUN REJIMI CONTEXT PROVIDER
 * =====================================================
 * 
 * Bu modul ilovaning tun (dark) va kun (light) rejimini
 * boshqarish uchun React Context yaratadi.
 * 
 * Tanlov localStorage da saqlanadi va offlayn ishlaydi.
 * 
 * OLIB TASHLASH UCHUN:
 * 1. Ushbu faylni o'chiring: src/lib/theme-context.tsx
 * 2. src/components/ui/theme-toggle.tsx faylini o'chiring
 * 3. App.tsx dan ThemeProvider ni olib tashlang
 * 4. Komponent ishlatilgan joylardan <ThemeToggle /> ni olib tashlang
 * 
 * =====================================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "htapp-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // localStorage dan oldingi tanlovni o'qish
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      // Tizim sozlamasini tekshirish
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  // Tema o'zgarganda DOM ga qo'llash
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // localStorage ga saqlash
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
