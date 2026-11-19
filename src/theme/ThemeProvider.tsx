import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, type ThemeId } from "./themes";

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT_THEME, setTheme: () => {} });

function readInitial(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const bg = THEMES.find((t) => t.id === theme)!.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return <Ctx.Provider value={{ theme, setTheme: setThemeState }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
