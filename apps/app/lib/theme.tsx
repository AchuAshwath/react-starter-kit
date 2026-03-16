import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "app-theme-preference";
const LEGACY_STORAGE_KEY = "app-theme";
const LIGHT_THEME_COLOR = "#fafafa";
const DARK_THEME_COLOR = "#0f0f0f";

// Keep this runtime resolution in sync with the inline bootstrap script in index.html.

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function parseThemePreference(value: string | null): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return null;
}

function getInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const storedPreference = parseThemePreference(
      window.localStorage.getItem(STORAGE_KEY),
    );
    if (storedPreference) {
      return storedPreference;
    }

    const legacyTheme = parseThemePreference(
      window.localStorage.getItem(LEGACY_STORAGE_KEY),
    );
    if (legacyTheme === "light" || legacyTheme === "dark") {
      return legacyTheme;
    }
  } catch {
    return "system";
  }

  return "system";
}

function resolveTheme(preference: ThemePreference, systemTheme: Theme): Theme {
  if (preference === "system") {
    return systemTheme;
  }

  return preference;
}

function setThemeColorMeta(theme: Theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute(
    "content",
    theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
  );
}

function applyThemeWithoutTransitions(theme: Theme) {
  const root = document.documentElement;
  const style = document.createElement("style");
  style.textContent = "*{transition:none!important}";
  document.head.appendChild(style);

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  setThemeColorMeta(theme);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove();
    });
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] =
    useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = useMemo(
    () => resolveTheme(preference, systemTheme),
    [preference, systemTheme],
  );

  useLayoutEffect(() => {
    applyThemeWithoutTransitions(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Ignore storage write failures (e.g., private browsing mode).
    }
  }, [preference]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== LEGACY_STORAGE_KEY) return;

      if (event.key === STORAGE_KEY) {
        const nextPreference = parseThemePreference(event.newValue) ?? "system";
        setPreference(nextPreference);
        return;
      }

      const legacyTheme = parseThemePreference(event.newValue);
      if (legacyTheme === "light" || legacyTheme === "dark") {
        setPreference(legacyTheme);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
    }),
    [theme, preference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
