import merge from "lodash.merge";
import { theme as lightSiteTheme } from "theme.config";
import { darkColors } from "./colors";
import { ThemeConfig } from "types/ThemeConfig";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "yellowcollective-theme";
export const THEME_CHANGE_EVENT = "yellowcollective-themechange";

export const getThemeConfigForMode = (mode: ThemeMode): ThemeConfig => {
  if (mode === "dark") {
    return merge({}, lightSiteTheme, {
      styles: {
        colors: darkColors,
      },
    } as Partial<ThemeConfig>);
  }

  return lightSiteTheme;
};
