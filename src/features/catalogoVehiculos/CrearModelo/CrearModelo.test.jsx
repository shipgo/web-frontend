import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, MantineProvider } from "@mantine/core";

import CrearModelo from "./index";

const mockSave = vi.fn();
const mockGetAllMarcas = vi.fn();

vi.mock("@api/vehiculo.api", () => ({
  marcaApi: {
    getAll: (...args) => mockGetAllMarcas(...args),
    getById: vi.fn(),
    get: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  modeloApi: {
    save: (...args) => mockSave(...args),
    getAll: vi.fn(),
    getById: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const renderWithProviders = (ui) =>
  render(
    <MantineProvider>
      <AppShell footer={{ height: 60 }}>{ui}</AppShell>
    </MantineProvider>
  );

describe("CrearModelo", () => {
  beforeEach(() => {
    mockSave.mockReset();
    mockGetAllMarcas.mockReset();
    mockGetAllMarcas.mockResolvedValue([{ id: 7, nombre: "Mercedes-Benz" }]);
  });

  it("submits a payload matching the ModeloReqDTO shape (marcaID as int)", async () => {
    const user = userEvent.setup();
    mockSave.mockResolvedValue({});
    renderWithProviders(<CrearModelo />);

    await waitFor(() => expect(mockGetAllMarcas).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/^Nombre/), "Sprinter");

    await user.click(screen.getByRole("combobox", { name: /^Marca/ }));
    await user.click(await screen.findByText("Mercedes-Benz"));

    const anioInput = screen.getByLabelText(/^Año/);
    await user.clear(anioInput);
    await user.type(anioInput, "2020");

    await user.click(screen.getByRole("button", { name: /crear modelo/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave).toHaveBeenCalledWith({
      nombre: "Sprinter",
      marcaID: 7,
      anio: 2020,
    });
  });

  it.each([
    ["1800", "El año debe ser mayor o igual a 1900"],
    [String(new Date().getFullYear() + 5), `El año debe ser menor o igual a ${new Date().getFullYear() + 1}`],
  ])("año fuera de rango (%s): error inline, sin clamp silencioso y sin guardar (SHG-FE-107)", async (anio, mensaje) => {
    const user = userEvent.setup();
    renderWithProviders(<CrearModelo />);
    await waitFor(() => expect(mockGetAllMarcas).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/^Nombre/), "Sprinter");
    await user.click(screen.getByRole("combobox", { name: /^Marca/ }));
    await user.click(await screen.findByText("Mercedes-Benz"));

    const anioInput = screen.getByLabelText(/^Año/);
    await user.clear(anioInput);
    await user.type(anioInput, anio);
    await user.click(screen.getByRole("button", { name: /crear modelo/i }));

    expect((await screen.findAllByText(mensaje)).length).toBeGreaterThan(0);
    expect(anioInput).toHaveValue(anio);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
