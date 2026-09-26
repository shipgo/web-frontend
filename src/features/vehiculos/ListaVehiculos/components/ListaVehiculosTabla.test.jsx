import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/vehiculos", mockNavigate],
  };
});

vi.mock("@api", () => ({
  vehiculoApi: { delete: vi.fn() },
}));

import ListaVehiculosTabla from "./ListaVehiculosTabla";

const VEHICULO = {
  id: 1,
  patente: "AB123CD",
  modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
  tipoVehiculo: { nombre: "Camioneta" },
  sucursal: { nombre: "Sucursal Centro" },
  anioCompra: 2020,
};

const renderTabla = (props = {}) =>
  render(
    <MantineProvider>
      <ModalsProvider>
        <ListaVehiculosTabla items={[VEHICULO]} {...props} />
      </ModalsProvider>
    </MantineProvider>,
  );

describe("ListaVehiculosTabla", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no ofrece "Asignar chofer" (SHG-FE-098: no hay relación fija chofer-vehículo)', async () => {
    const user = userEvent.setup();
    renderTabla();

    await user.click(screen.getByRole("button", { name: /acciones de ab123cd/i }));

    expect(screen.queryByRole("menuitem", { name: "Asignar chofer" })).not.toBeInTheDocument();
  });

  it('"Historial mantenimiento" navega a /mantenimientos filtrado por patente', async () => {
    const user = userEvent.setup();
    renderTabla();

    await user.click(screen.getByRole("button", { name: /acciones de ab123cd/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Historial mantenimiento" }));

    expect(mockNavigate).toHaveBeenCalledWith("~/mantenimientos?patente=AB123CD");
  });
});
