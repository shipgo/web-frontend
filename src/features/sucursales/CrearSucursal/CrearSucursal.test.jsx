import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";

import CrearSucursal from "./index";

const mockSave = vi.fn();
const mockGetAllProvincias = vi.fn();
const mockGetAllLocalidades = vi.fn();

vi.mock("@api", () => ({
  sucursalApi: {
    save: (...args) => mockSave(...args),
    getById: vi.fn(),
    update: vi.fn(),
  },
  provinciaApi: {
    getAll: (...args) => mockGetAllProvincias(...args),
  },
  localidadApi: {
    getByProvincia: (...args) => mockGetAllLocalidades(...args),
  },
}));

const renderWithProviders = (ui) =>
  render(<MantineProvider>{ui}</MantineProvider>);

describe("CrearSucursal", () => {
  beforeEach(() => {
    mockSave.mockReset();
    mockGetAllProvincias.mockReset();
    mockGetAllLocalidades.mockReset();
    mockGetAllProvincias.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    mockGetAllLocalidades.mockResolvedValue([
      { id: 5, nombre: "Córdoba Capital" },
    ]);
  });

  it("submits a payload matching the SucursalReqDTO nested shape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearSucursal />);

    await waitFor(() => expect(mockGetAllProvincias).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/^Nombre/), "Sucursal Norte");
    await user.type(screen.getByLabelText(/^Prefijo/), "+54");
    await user.type(screen.getByLabelText(/^Teléfono/), "3511234567");
    await user.type(screen.getByLabelText(/^Email/), "norte@shipgo.com");
    await user.type(screen.getByLabelText(/^Calle/), "Av. Colón");
    await user.type(screen.getByLabelText(/^Número/), "1234");

    await user.click(screen.getByRole("combobox", { name: /^Provincia/ }));
    await user.click(await screen.findByText("Córdoba"));

    await waitFor(() => expect(mockGetAllLocalidades).toHaveBeenCalled());

    await user.click(screen.getByRole("combobox", { name: /^Localidad/ }));
    await user.click(await screen.findByText("Córdoba Capital"));

    await user.click(screen.getByRole("button", { name: /crear sucursal/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    expect(mockSave).toHaveBeenCalledWith({
      nombre: "Sucursal Norte",
      email: "norte@shipgo.com",
      prefijo: "+54",
      telefono: "3511234567",
      puntoEntrega: {
        numeroCalle: "1234",
        nombreCalle: "Av. Colón",
        localidadID: 5,
      },
    });
  });
});
