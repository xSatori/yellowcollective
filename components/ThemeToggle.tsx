import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import Button from "./Button";
import { useThemeMode } from "@/hooks/useThemeMode";
import clsx from "clsx";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDarkMode, toggleThemeMode } = useThemeMode();
  const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      aria-pressed={isDarkMode}
      title={label}
      onClick={toggleThemeMode}
      className={clsx(
        "yc-theme-toggle shrink-0 rounded-xl border border-skin-stroke text-skin-base transition ease-in-out hover:-translate-y-0.5 hover:shadow-[0px_6px_0px_0px_rgb(var(--color-shadow-neutral-hover))]",
        className
      )}
    >
      {isDarkMode ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </Button>
  );
}
