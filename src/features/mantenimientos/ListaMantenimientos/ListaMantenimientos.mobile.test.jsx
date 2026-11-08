import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: "",
}));

vi.mock("@api/mantenimiento.api", () => ({
  mantenimientoApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
  tipoMantenimientoApi: { getAll: vi.fn() },
}));

import { mantenimientoApi } from "@api/mantenimiento.api";
import ListaMantenimientos from "./index";

const MANTENIMIENTO = {
  id: 1,
  nombreMecanico: "Juan",
  apellidoMecanico: "Pérez",
  fechaHoraMantenimiento: "2026-06-15T09:00:00",
  fechaHoraRegistro: "2026-06-01T12:00:00",
  tipoMantenimiento: { id: 3, nombre: "Cambio de aceite" },
  vehiculo: { id: 7, patente: "AB123CD", modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } } },
  sucursal: { id: 2, nombre: "Sucursal Centro" },
};

describe("ListaMantenimientos en mobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mantenimientoApi.get.mockResolvedValue({
      content: [MANTENIMIENTO],
      totalElements: 1,
      totalPages: 1,
    });
  });

  it("muestra tarjetas en vez de tabla", async () => {
    renderWithProviders(<ListaMantenimientos />);

    expect(await screen.findByTestId("list-card")).toBeInTheDocument();
    expect(screen.getByText("AB123CD")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("selecciona una tarjeta y muestra el banner de selección", async () => {
    renderWithProviders(<ListaMantenimientos />);
    await screen.findByTestId("list-card");

    await userEvent.click(screen.getByRole("checkbox", { name: "Seleccionar AB123CD" }));

    expect(await screen.findByText("1 mantenimiento seleccionado")).toBeInTheDocument();
  });

  it("usa el botón Filtros para los filtros secundarios", async () => {
    renderWithProviders(<ListaMantenimientos />);
    await screen.findByTestId("list-card");

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("Mecánico")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(await screen.findByLabelText("Mecánico")).toBeInTheDocument();
  });
});
