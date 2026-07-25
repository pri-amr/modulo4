import { render, screen } from "@testing-library/react";
import { Loader } from "@/components/shared/Loader";

describe("Loader", () => {
  it("renders a full-screen circular overlay with role=status (FR-045)", () => {
    render(<Loader />);

    const overlay = screen.getByRole("status", { name: "Cargando" });
    expect(overlay).toHaveClass("fixed", "inset-0");
  });

  it("renders an indeterminate circular spinner filled with #376BCB that spins continuously (FR-055)", () => {
    render(<Loader />);

    const spinner = screen.getByTestId("loader-spinner");
    expect(spinner).toHaveClass("animate-spin");

    const arc = spinner.querySelector("circle");
    expect(arc).not.toBeNull();
    expect(arc).toHaveAttribute("stroke", "#376BCB");
    expect(arc).toHaveClass("animate-loader-dash");
  });
});
