import { useCallback, useEffect, useState } from "react";
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  ThemeMode,
} from "theme/modes";
import {
  applyThemeMode,
  getPreferredThemeMode,
  isThemeMode,
  notifyThemeModeChange,
  persistThemeMode,
} from "@/utils/themeMode";

const getAppliedThemeMode = (): ThemeMode | null => {
  if (typeof document === "undefined") return null;

  const appliedTheme = document.documentElement.dataset.theme ?? null;
  return isThemeMode(appliedTheme) ? appliedTheme : null;
};

export const useThemeMode = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const initialThemeMode = getAppliedThemeMode() || getPreferredThemeMode();
    setThemeModeState(initialThemeMode);
    applyThemeMode(initialThemeMode);

    const handleThemeChange = (event: Event) => {
      const nextThemeMode = (event as CustomEvent<ThemeMode>).detail;
      if (isThemeMode(nextThemeMode)) {
        setThemeModeState(nextThemeMode);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextThemeMode = isThemeMode(event.newValue)
        ? event.newValue
        : getPreferredThemeMode();
      applyThemeMode(nextThemeMode);
      setThemeModeState(nextThemeMode);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setThemeMode = useCallback((nextThemeMode: ThemeMode) => {
    applyThemeMode(nextThemeMode);
    persistThemeMode(nextThemeMode);
    setThemeModeState(nextThemeMode);
    notifyThemeModeChange(nextThemeMode);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  }, [setThemeMode, themeMode]);

  return {
    isDarkMode: themeMode === "dark",
    setThemeMode,
    themeMode,
    toggleThemeMode,
  };
};
