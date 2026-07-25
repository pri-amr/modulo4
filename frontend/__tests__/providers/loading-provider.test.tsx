import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadingProvider, useLoading } from "@/providers/LoadingProvider";

function Consumer() {
  const { isLoading, start, stop } = useLoading();
  return (
    <div>
      <span data-testid="state">{isLoading ? "loading" : "idle"}</span>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
    </div>
  );
}

describe("LoadingProvider", () => {
  it("starts idle, without the Loader overlay", () => {
    render(
      <LoadingProvider>
        <Consumer />
      </LoadingProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("idle");
    expect(screen.queryByRole("status", { name: "Cargando" })).not.toBeInTheDocument();
  });

  it("shows the Loader overlay after start() and hides it after stop() (FR-045)", async () => {
    const user = userEvent.setup();
    render(
      <LoadingProvider>
        <Consumer />
      </LoadingProvider>,
    );

    await user.click(screen.getByText("start"));
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();

    await user.click(screen.getByText("stop"));
    expect(screen.getByTestId("state")).toHaveTextContent("idle");
    expect(screen.queryByRole("status", { name: "Cargando" })).not.toBeInTheDocument();
  });

  it("only goes idle once every overlapping start() has a matching stop()", async () => {
    const user = userEvent.setup();
    render(
      <LoadingProvider>
        <Consumer />
      </LoadingProvider>,
    );

    await user.click(screen.getByText("start"));
    await user.click(screen.getByText("start"));
    await user.click(screen.getByText("stop"));
    expect(screen.getByTestId("state")).toHaveTextContent("loading");

    await user.click(screen.getByText("stop"));
    expect(screen.getByTestId("state")).toHaveTextContent("idle");
  });

  it("throws when useLoading is used outside a LoadingProvider", () => {
    const Broken = () => {
      useLoading();
      return null;
    };
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Broken />)).toThrow("useLoading must be used within a LoadingProvider");

    spy.mockRestore();
  });
});
