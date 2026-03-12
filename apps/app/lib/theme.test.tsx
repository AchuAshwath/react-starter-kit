import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme";

function ThemeProbe() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <>
      <div data-testid="theme-value">{theme}</div>
      <button onClick={() => setTheme("dark")} type="button">
        set-dark
      </button>
      <button onClick={() => setTheme("light")} type="button">
        set-light
      </button>
      <button onClick={toggleTheme} type="button">
        toggle-theme
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  const storage = new Map<string, string>();
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalLocalStorage: Storage;

  const localStorageMock: Storage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index: number) => {
      const keys = Array.from(storage.keys());
      return keys[index] ?? null;
    },
    get length() {
      return storage.size;
    },
  };

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    cleanup();

    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    }

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });

    vi.restoreAllMocks();
  });

  it("uses persisted localStorage theme on first render", () => {
    window.localStorage.setItem("app-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to system preference when no theme is persisted", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("writes updates to localStorage and keeps DOM class in sync", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(window.localStorage.getItem("app-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(window.localStorage.getItem("app-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("reacts to theme updates from storage events", async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: "app-theme" });
    Object.defineProperty(event, "newValue", { value: "dark" });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("falls back to system preference when storage key is cleared", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set-light" }));
    window.localStorage.removeItem("app-theme");

    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: "app-theme" });
    Object.defineProperty(event, "newValue", { value: null });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    });
  });

  it("recovers when storage read throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: {
        ...localStorageMock,
        getItem: () => {
          throw new Error("read denied");
        },
      } as Storage,
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
  });

  it("ignores storage write failures", () => {
    const setItem = vi.fn(() => {
      throw new Error("write denied");
    });

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: {
        ...localStorageMock,
        setItem,
      } as Storage,
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(setItem).toHaveBeenCalled();
  });
});
