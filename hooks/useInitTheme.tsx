import { useEffect } from "react";
import { applyThemeMode, getPreferredThemeMode } from "@/utils/themeMode";

export const useInitTheme = () => {
  useEffect(() => {
    applyThemeMode(getPreferredThemeMode());
  }, []);
};
