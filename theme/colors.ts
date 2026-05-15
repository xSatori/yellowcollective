import { ThemeColors } from "types/ThemeConfig/ThemeColors";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "tailwind.config.js";

const withRGB = (val: string): `${string}, ${string}, ${string}` => {
  val = val.replace("#", "");
  const match = val.match(/.{1,2}/g)!;
  const [r, g, b] = match.map((x) => parseInt(x, 16));
  return `${r}, ${g}, ${b}`;
};

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme!.colors as any;

export const lightColors: ThemeColors = {
  accent: "251, 203, 7",
  "accent-hover": "255, 216, 77",
  "accent-soft": "255, 247, 191",
  action: "0, 102, 204",
  "action-hover": "7, 94, 174",
  "action-shadow": "0, 76, 153",
  disabled: withRGB(colors.gray["300"]),
  fill: "255, 255, 255",
  muted: withRGB(colors.gray["100"]),
  surface: "255, 255, 255",
  "surface-muted": "247, 247, 247",
  stroke: "215, 215, 215",
  "stroke-strong": "182, 182, 182",
  backdrop: "251, 203, 7",
  "header-bg": "34, 34, 34",
  "header-text": "255, 255, 255",
  "shadow-neutral": "187, 187, 187",
  "shadow-neutral-hover": "187, 187, 187",
  "shadow-accent": "184, 148, 0",
  "focus-ring": "7, 134, 251",
  "focus-offset": "255, 255, 255",
  "text-base": withRGB(colors.gray["900"]),
  "text-muted": "85, 91, 97",
  "text-inverted": "255, 255, 255",
  "text-highlighted": withRGB(colors.blue["500"]),
  "button-accent": withRGB(colors.gray["900"]),
  "button-accent-hover": withRGB(colors.gray["700"]),
  "button-muted": withRGB(colors.gray["300"]),
  "proposal-success": withRGB(colors.green["600"]),
  "proposal-danger": withRGB(colors.red["600"]),
  "proposal-muted": withRGB(colors.neutral["500"]),
  "proposal-highlighted": withRGB(colors.blue["600"]),
};

export const darkColors: ThemeColors = {
  accent: "251, 203, 7",
  "accent-hover": "255, 227, 106",
  "accent-soft": "61, 48, 0",
  action: "110, 149, 255",
  "action-hover": "149, 181, 255",
  "action-shadow": "11, 47, 142",
  disabled: "51, 56, 61",
  fill: "23, 23, 23",
  muted: "34, 34, 34",
  surface: "23, 23, 23",
  "surface-muted": "34, 34, 34",
  stroke: "74, 79, 82",
  "stroke-strong": "95, 99, 104",
  backdrop: "34, 34, 34",
  "header-bg": "251, 203, 7",
  "header-text": "33, 37, 41",
  "shadow-neutral": "0, 0, 0",
  "shadow-neutral-hover": "0, 0, 0",
  "shadow-accent": "138, 95, 10",
  "focus-ring": "110, 149, 255",
  "focus-offset": "16, 16, 16",
  "text-base": "247, 247, 247",
  "text-muted": "191, 199, 204",
  "text-inverted": "17, 17, 17",
  "text-highlighted": "110, 149, 255",
  "button-accent": "247, 247, 247",
  "button-accent-hover": withRGB(colors.neutral["200"]),
  "button-muted": withRGB(colors.neutral["400"]),
  "proposal-success": withRGB(colors.green["600"]),
  "proposal-danger": withRGB(colors.red["600"]),
  "proposal-muted": withRGB(colors.neutral["500"]),
  "proposal-highlighted": withRGB(colors.blue["600"]),
};
