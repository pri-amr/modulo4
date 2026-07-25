import { useThemeStore } from "@/stores/themeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "dark" });
  });

  it("defaults to dark mode (FR-054)", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggles between dark and light", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("persists the preference to localStorage (FR-054)", () => {
    useThemeStore.getState().toggleTheme();

    const stored = JSON.parse(localStorage.getItem("theme-preference") ?? "{}");
    expect(stored.state.theme).toBe("light");
  });
});
