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
  const { theme, preference, setPreference } = useTheme();

  return (
    <>
      <div data-testid="resolved-theme">{theme}</div>
      <div data-testid="preference">{preference}</div>
      <button onClick={() => setPreference("light")} type="button">
        set-light
      </button>
      <button onClick={() => setPreference("dark")} type="button">
        set-dark
      </button>
      <button onClick={() => setPreference("system")} type="button">
        set-system
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  const storage = new Map<string, string>();
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalLocalStorage: Storage;

  function createMediaQueryList(matches: boolean): MediaQueryList {
    return {
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  }

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

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(createMediaQueryList(false)),
    });

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.dataset.themeColorLight = "#fafafa";
    document.documentElement.dataset.themeColorDark = "#0f0f0f";

    const existingMeta = document.querySelector('meta[name="theme-color"]');
    if (!existingMeta) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", "#fafafa");
      document.head.appendChild(meta);
    } else {
      existingMeta.setAttribute("content", "#fafafa");
    }
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

    delete document.documentElement.dataset.themeColorLight;
    delete document.documentElement.dataset.themeColorDark;

    vi.restoreAllMocks();
  });

  it("defaults to system preference when nothing is stored", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(createMediaQueryList(true)),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("system");
  });

  it("uses persisted explicit preference", () => {
    window.localStorage.setItem("app-theme-preference", "dark");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#0f0f0f");
  });

  it("migrates legacy app-theme values", () => {
    window.localStorage.setItem("app-theme", "light");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("light");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("light");
  });

  it("updates preference and stores only the preference", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("dark");
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#0f0f0f");

    fireEvent.click(screen.getByRole("button", { name: "set-light" }));
    expect(screen.getByTestId("preference")).toHaveTextContent("light");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("light");
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#fafafa");

    fireEvent.click(screen.getByRole("button", { name: "set-system" }));
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("system");
  });

  it("reacts to OS theme changes while preference is system", async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        ...createMediaQueryList(false),
        addEventListener: (
          _: string,
          cb: (event: MediaQueryListEvent) => void,
        ) => listeners.add(cb),
        removeEventListener: (
          _: string,
          cb: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(cb),
      }),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    listeners.forEach((listener) =>
      listener({ matches: true } as MediaQueryListEvent),
    );

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(
        document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute("content"),
      ).toBe("#0f0f0f");
    });
  });

  it("syncs preference across tabs via storage events", async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: "app-theme-preference" });
    Object.defineProperty(event, "newValue", { value: "dark" });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId("preference")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  it("does not overwrite preference with resolved system theme", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(createMediaQueryList(true)),
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(window.localStorage.getItem("app-theme-preference")).toBe("system");
  });
});
