import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

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
  vehiculo: {
    id: 7,
    patente: "AB123CD",
    modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
  },
  sucursal: { id: 2, nombre: "Sucursal Centro" },
};

describe("ListaMantenimientos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza filas con los campos reales de MantenimientoDTO (sin estado ni costo)", async () => {
    mantenimientoApi.get.mockResolvedValue({
      content: [MANTENIMIENTO],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaMantenimientos />);

    expect(await screen.findByText("AB123CD")).toBeInTheDocument();
    expect(screen.getByText("Toyota Hilux")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    // No hay columnas inventadas de estado / costo.
    expect(screen.queryByText("Estado")).not.toBeInTheDocument();
    expect(screen.queryByText("Costo")).not.toBeInTheDocument();
  });

  it("muestra el empty-state cuando no hay mantenimientos", async () => {
    mantenimientoApi.get.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });

    renderWithProviders(<ListaMantenimientos />);

    expect(
      await screen.findByText("Sin mantenimientos que mostrar"),
    ).toBeInTheDocument();
  });

  it("manda los filtros con los nombres exactos de MantenimientoFilter (nombre / patente)", async () => {
    mantenimientoApi.get.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });

    const user = userEvent.setup();
    renderWithProviders(<ListaMantenimientos />);

    await waitFor(() => expect(mantenimientoApi.get).toHaveBeenCalled());

    await user.type(screen.getByLabelText("Patente"), "AB123");

    await waitFor(() => {
      const lastCall = mantenimientoApi.get.mock.calls.at(-1)[0];
      expect(lastCall.patente).toBe("AB123");
      expect(lastCall.page).toBe(0);
    });
  });

  it("muestra un toast de warning (no error genérico) cuando el DELETE devuelve 409", async () => {
    mantenimientoApi.get.mockResolvedValue({
      content: [MANTENIMIENTO],
      totalElements: 1,
      totalPages: 1,
    });
    mantenimientoApi.delete.mockRejectedValue({
      response: {
        status: 409,
        data: { statusCode: 409, message: "No se puede eliminar el mantenimiento." },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<ListaMantenimientos />);

    expect(await screen.findByText("AB123CD")).toBeInTheDocument();

    const table = screen.getByRole("table");
    await user.click(within(table).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("No se puede eliminar")).toBeInTheDocument();
  });
});
