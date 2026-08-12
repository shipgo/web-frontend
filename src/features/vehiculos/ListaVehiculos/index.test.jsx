import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@api/vehiculo.api", () => ({
  vehiculoApi: {
    get: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  marcaApi: { getAll: vi.fn() },
  modeloApi: { getAll: vi.fn() },
  tipoVehiculoApi: { getAll: vi.fn() },
  combustibleApi: { getAll: vi.fn() },
  tipoRuedaApi: { getAll: vi.fn() },
}));

import { vehiculoApi } from "@api/vehiculo.api";
import ListaVehiculos from "./index";

describe("ListaVehiculos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vehicle rows from the API response", async () => {
    vehiculoApi.get.mockResolvedValue({
      content: [
        {
          id: 1,
          patente: "AB123CD",
          modelo: { nombre: "Corolla", marca: { nombre: "Toyota" } },
          tipoVehiculo: { nombre: "Camión" },
          estado: "DISPONIBLE",
          anioCompra: 2020,
        },
        {
          id: 2,
          patente: "XY987ZQ",
          modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
          tipoVehiculo: { nombre: "Camioneta" },
          estado: "MANTENIMIENTO",
          anioCompra: 2018,
        },
      ],
      totalElements: 2,
      totalPages: 1,
    });

    renderWithProviders(<ListaVehiculos />);

    await waitFor(() => {
      expect(screen.getByText("AB123CD")).toBeInTheDocument();
    });

    expect(screen.getByText("XY987ZQ")).toBeInTheDocument();
    expect(vehiculoApi.get).toHaveBeenCalled();
  });

  it("shows an empty state when there are no vehicles", async () => {
    vehiculoApi.get.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });

    renderWithProviders(<ListaVehiculos />);

    await waitFor(() => {
      expect(
        screen.getByText(/sin vehículos que mostrar/i)
      ).toBeInTheDocument();
    });
  });
});
