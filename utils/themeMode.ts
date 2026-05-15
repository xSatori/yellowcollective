import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  ThemeMode,
  getThemeConfigForMode,
} from "theme/modes";
import { applyThemeProperties } from "./applyThemeProperties";

export const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark";

export const getPreferredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(savedTheme)) return savedTheme;
  } catch (error) {
    console.warn("Unable to read theme preference", error);
  }

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

export const applyThemeMode = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  applyThemeProperties(getThemeConfigForMode(mode));

  const themeColor = mode === "dark" ? "#222222" : "#FBCB07";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor);
};

export const persistThemeMode = (mode: ThemeMode) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Unable to save theme preference", error);
  }
};

export const notifyThemeModeChange = (mode: ThemeMode) => {
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: mode }));
};
