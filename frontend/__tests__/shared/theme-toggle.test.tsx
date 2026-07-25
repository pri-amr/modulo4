import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useThemeStore } from "@/stores/themeStore";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "dark" });
    document.documentElement.classList.remove("dark");
  });

  it("renders as a fixed icon, visible on every screen (FR-054)", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Cambiar a modo claro" });
    expect(button).toHaveClass("fixed");
  });

  it("toggles the theme and the dark class on <html> when clicked (FR-054)", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Cambiar a modo claro" }));

    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByRole("button", { name: "Cambiar a modo oscuro" })).toBeInTheDocument();
  });
});
