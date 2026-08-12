import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useParams: () => ({ id: "7" }),
    useLocation: () => ["/sucursales/7/editar", mockNavigate],
  };
});

import EditarSucursal from "./index";

const mockGetById = vi.fn();
const mockUpdate = vi.fn();
const mockGetAllProvincias = vi.fn();
const mockGetAllLocalidades = vi.fn();

vi.mock("@api", () => ({
  sucursalApi: {
    getById: (...args) => mockGetById(...args),
    update: (...args) => mockUpdate(...args),
    save: vi.fn(),
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

describe("EditarSucursal", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockUpdate.mockReset();
    mockGetAllProvincias.mockReset();
    mockGetAllLocalidades.mockReset();

    mockGetAllProvincias.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    mockGetAllLocalidades.mockResolvedValue([
      { id: 5, nombre: "Córdoba Capital" },
    ]);

    mockGetById.mockResolvedValue({
      id: 7,
      nombre: "Sucursal Norte",
      email: "norte@shipgo.com",
      prefijo: "+54",
      telefono: "3511234567",
      puntoEntrega: {
        id: 10,
        nombreCalle: "Av. Colón",
        numeroCalle: "1234",
        localidad: {
          id: 5,
          nombre: "Córdoba Capital",
          provincia: { id: 2, nombre: "Córdoba" },
        },
      },
    });
  });

  it("prefills the form from the getById response", async () => {
    renderWithProviders(<EditarSucursal />);

    await waitFor(() => expect(mockGetById).toHaveBeenCalledWith("7"));

    expect(await screen.findByDisplayValue("Sucursal Norte")).toBeInTheDocument();
    expect(screen.getByDisplayValue("norte@shipgo.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+54")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3511234567")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Av. Colón")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1234")).toBeInTheDocument();

    await waitFor(() =>
      expect(mockGetAllLocalidades).toHaveBeenCalledWith("2")
    );

    expect(await screen.findByDisplayValue("Córdoba")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Córdoba Capital")).toBeInTheDocument();
  });

  it("submits an update payload matching the SucursalReqDTO nested shape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarSucursal />);

    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    await screen.findByDisplayValue("Sucursal Norte");
    await waitFor(() => expect(mockGetAllLocalidades).toHaveBeenCalled());
    await screen.findByDisplayValue("Córdoba Capital");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));

    expect(mockUpdate).toHaveBeenCalledWith("7", {
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
