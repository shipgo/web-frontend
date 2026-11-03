import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, MantineProvider } from "@mantine/core";

import CrearMarca from "./index";

const mockSave = vi.fn();

vi.mock("@api/vehiculo.api", () => ({
  marcaApi: {
    save: (...args) => mockSave(...args),
    getAll: vi.fn(),
    getById: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  modeloApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    get: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// `MarcaForm` monta `<PageFooter>` (`AppShellFooter`), que necesita un
// `<AppShell>` ancestro, igual que `CrearSucursal.test.jsx`.
const renderWithProviders = (ui) =>
  render(
    <MantineProvider>
      <AppShell footer={{ height: 60 }}>{ui}</AppShell>
    </MantineProvider>
  );

describe("CrearMarca", () => {
  beforeEach(() => {
    mockSave.mockReset();
  });

  it("submits a payload matching the MarcaReqDTO shape", async () => {
    const user = userEvent.setup();
    mockSave.mockResolvedValue({});
    renderWithProviders(<CrearMarca />);

    await user.type(screen.getByLabelText(/^Nombre/), "Mercedes-Benz");
    await user.click(screen.getByRole("button", { name: /crear marca/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave).toHaveBeenCalledWith({ nombre: "Mercedes-Benz" });
  });

  it("marca el error de campo del backend", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          message: "Error de validación",
          fields: [{ field: "nombre", error: "ya existe una marca con ese nombre" }],
        },
      },
    });
    renderWithProviders(<CrearMarca />);

    await user.type(screen.getByLabelText(/^Nombre/), "Mercedes-Benz");
    await user.click(screen.getByRole("button", { name: /crear marca/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(
      await screen.findByText("ya existe una marca con ese nombre")
    ).toBeInTheDocument();
  });
});
