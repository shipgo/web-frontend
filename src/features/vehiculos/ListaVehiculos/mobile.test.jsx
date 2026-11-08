import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => true, MOBILE_QUERY: "" }));

vi.mock("@api/vehiculo.api", () => ({
  vehiculoApi: { get: vi.fn(), delete: vi.fn() },
  marcaApi: { getAll: vi.fn().mockResolvedValue([]) },
  modeloApi: { getAll: vi.fn().mockResolvedValue([]) },
  tipoVehiculoApi: { getAll: vi.fn().mockResolvedValue([]) },
  combustibleApi: { getAll: vi.fn().mockResolvedValue([]) },
  tipoRuedaApi: { getAll: vi.fn().mockResolvedValue([]) },
}));

import { vehiculoApi } from "@api/vehiculo.api";
import ListaVehiculos from "./index";

describe("ListaVehiculos en mobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      ],
      totalElements: 1,
      totalPages: 1,
    });
  });

  it("muestra tarjetas con la patente y el botón de filtros, sin tabla", async () => {
    renderWithProviders(<ListaVehiculos />);

    expect(await screen.findByText("AB123CD")).toBeInTheDocument();
    expect(screen.getAllByTestId("list-card")).toHaveLength(1);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
  });

  it("seleccionar una tarjeta muestra el banner de selección", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaVehiculos />);

    await user.click(await screen.findByRole("checkbox", { name: "Seleccionar vehículo AB123CD" }));
    expect(await screen.findByText("1 vehículo seleccionado")).toBeInTheDocument();
  });
});
