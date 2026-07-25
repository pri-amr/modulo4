import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { LoadingProvider } from "@/providers/LoadingProvider";
import { handleRequest } from "@/services/handleRequest";

jest.mock("@/services/handleRequest");
const mockedHandleRequest = handleRequest as jest.MockedFunction<typeof handleRequest>;

function renderForm(props?: Partial<React.ComponentProps<typeof TransactionForm>>) {
  return render(
    <LoadingProvider>
      <TransactionForm moneySources={[]} categories={[]} {...props} />
    </LoadingProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Fuente de dinero"), "source-1");
  await user.selectOptions(screen.getByLabelText("Categoría"), "category-1");
  await user.type(screen.getByLabelText("Monto"), "1234,56");
  await user.type(screen.getByLabelText("Fecha"), "2026-07-24");
  await user.type(screen.getByLabelText("Descripción"), "Almuerzo");
}

const moneySources = [{ id: "source-1", name: "Lemon" }];
const categories = [{ id: "category-1", name: "Comida" }];

describe("TransactionForm", () => {
  it("renders empty selectors when the account has no money sources or categories yet (FR-009/FR-012)", () => {
    renderForm();

    expect(screen.getByLabelText("Fuente de dinero")).toHaveDisplayValue("Seleccionar…");
    expect(screen.getByLabelText("Fuente de dinero").children).toHaveLength(1);
    expect(screen.getByLabelText("Categoría").children).toHaveLength(1);
  });

  it("shows an inline error under the field and a red border when a required field is missing", async () => {
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto")).toHaveClass("border-red-500");
    expect(screen.getByText("La fuente de dinero es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La categoría es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La fecha es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La descripción es obligatoria")).toBeInTheDocument();
    expect(mockedHandleRequest).not.toHaveBeenCalled();
  });

  it("clears a field's error as soon as the user edits it", async () => {
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Monto"), "100");

    expect(screen.queryByText("El monto es obligatorio")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Monto")).not.toHaveClass("border-red-500");
  });

  it("rejects an amount of zero or negative (FR-025 clarificación)", async () => {
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await user.type(screen.getByLabelText("Monto"), "0");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El monto debe ser mayor a cero")).toBeInTheDocument();
    expect(mockedHandleRequest).not.toHaveBeenCalled();
  });

  it("parses the Argentine decimal format (comma) before submitting (FR-017 clarificación)", async () => {
    mockedHandleRequest.mockResolvedValueOnce({
      id: "tx-1",
      type: "expense",
      amount: 1234.56,
      currency: "ARS",
      moneySourceId: "source-1",
      categoryId: "category-1",
      date: "2026-07-24",
      description: "Almuerzo",
    });
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mockedHandleRequest).toHaveBeenCalledWith(
        "POST",
        "/transactions",
        expect.objectContaining({ amount: 1234.56 }),
      ),
    );
  });

  it("clears the form and notifies onCreated after a successful save (actualización en línea)", async () => {
    mockedHandleRequest.mockResolvedValueOnce({
      id: "tx-1",
      type: "expense",
      amount: 1234.56,
      currency: "ARS",
      moneySourceId: "source-1",
      categoryId: "category-1",
      date: "2026-07-24",
      description: "Almuerzo",
    });
    const onCreated = jest.fn();
    const user = userEvent.setup();
    renderForm({ moneySources, categories, onCreated });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: "tx-1" })));
    expect(screen.getByLabelText("Monto")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
  });

  it("disables the save button and shows the full-screen loader while the request is in flight (FR-045)", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    mockedHandleRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }) as ReturnType<typeof handleRequest>,
    );
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();

    resolveRequest({
      id: "tx-1",
      type: "expense",
      amount: 1234.56,
      currency: "ARS",
      moneySourceId: "source-1",
      categoryId: "category-1",
      date: "2026-07-24",
      description: "Almuerzo",
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar" })).not.toBeDisabled());
    expect(screen.queryByRole("status", { name: "Cargando" })).not.toBeInTheDocument();
  });

  it("keeps the entered data and shows the server error when saving fails, without a field (FR-020)", async () => {
    mockedHandleRequest.mockRejectedValueOnce({
      code: "INTERNAL_ERROR",
      message: "No se pudo guardar",
      field: null,
    });
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByText("No se pudo guardar")).toBeInTheDocument());
    expect(screen.getByLabelText("Monto")).toHaveValue("1234,56");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Almuerzo");
  });

  it("maps a backend field error onto the matching form field (FR-017)", async () => {
    mockedHandleRequest.mockRejectedValueOnce({
      code: "VALIDATION_ERROR",
      message: "La fuente de dinero no existe",
      field: "moneySourceId",
    });
    const user = userEvent.setup();
    renderForm({ moneySources, categories });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(screen.getByText("La fuente de dinero no existe")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Fuente de dinero")).toHaveClass("border-red-500");
  });
});
