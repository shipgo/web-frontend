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

  it("muestra el indicador de mantenimiento vigente y próximo con el copy del detalle (SHG-FE-118)", () => {
    renderTabla({
      items: [
        {
          ...VEHICULO,
          mantenimiento: {
            id: 3,
            fechaHoraMantenimiento: "2026-10-10T08:00:00.000",
            fechaHoraFin: "2026-10-11T18:30:00.000",
            vigente: true,
          },
        },
        {
          ...VEHICULO,
          id: 2,
          patente: "ZZ999ZZ",
          mantenimiento: {
            id: 4,
            fechaHoraMantenimiento: "2026-10-20T08:00:00.000",
            fechaHoraFin: "2026-10-21T18:30:00.000",
            vigente: false,
          },
        },
      ],
    });

    expect(screen.getByText("En mantenimiento hasta el 11/10/2026 18:30")).toBeInTheDocument();
    expect(
      screen.getByText("Mantenimiento programado del 20/10/2026 08:00 al 21/10/2026 18:30"),
    ).toBeInTheDocument();
  });

  it("sin el campo mantenimiento no muestra indicador", () => {
    renderTabla();
    expect(screen.queryByText(/en mantenimiento|mantenimiento programado/i)).not.toBeInTheDocument();
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

  it("muestra el año de compra, no una fecha 1969", () => {
    renderTabla();

    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.queryByText(/1969/)).not.toBeInTheDocument();
  });

  it("muestra el nombre de la sucursal del DTO y el fallback si falta", () => {
    renderTabla({ items: [VEHICULO, { ...VEHICULO, id: 2, patente: "ABC123", sucursal: null }] });

    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("Sin sucursal")).toBeInTheDocument();
  });

  it("click en la fila navega al detalle; el checkbox no", async () => {
    const user = userEvent.setup();
    renderTabla();

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByText("AB123CD"));
    expect(mockNavigate).toHaveBeenCalledWith("~/vehiculos/1");
  });

  it("la fila es accesible por teclado: Enter y Espacio navegan al detalle", async () => {
    const user = userEvent.setup();
    renderTabla();

    const fila = screen.getByRole("button", { name: "Ver detalle del vehículo AB123CD" });
    fila.focus();
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("~/vehiculos/1");

    mockNavigate.mockClear();
    await user.keyboard(" ");
    expect(mockNavigate).toHaveBeenCalledWith("~/vehiculos/1");
  });
});
