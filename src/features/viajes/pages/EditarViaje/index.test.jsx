import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "wouter";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api/viaje.api", () => ({
  viajeApi: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  detalleRecorridoApi: {},
}));

vi.mock("@api", () => ({
  vehiculoApi: { getAll: vi.fn() },
  usuarioApi: { getChoferes: vi.fn() },
}));

import { viajeApi } from "@api/viaje.api";
import { vehiculoApi, usuarioApi } from "@api";
import EditarViaje from "./index";

const EXISTING_VIAJE = {
  id: 42,
  fechaHoraInicio: "2026-08-01T10:00:00",
  fechaHoraFin: "2026-08-01T18:00:00",
  fechaHoraInicioPlanificada: "2026-08-01T09:00:00",
  fechaHoraFinPlanificada: "2026-08-01T17:00:00",
  vehiculo: { id: 5, patente: "AB123CD", modelo: { nombre: "Hilux" } },
  choferes: [{ id: 10, nombre: "Juan", apellido: "Perez" }],
  recorridos: [
    {
      id: 1,
      puntoEntrega: { id: 3 },
      sucursalDestino: null,
      detalleRecorridos: [{ id: 100, envio: { id: 200 } }, { id: 101, envio: { id: 201 } }],
    },
    {
      id: 2,
      puntoEntrega: null,
      sucursalDestino: { id: 7 },
      detalleRecorridos: [{ id: 102, envio: { id: 202 } }],
    },
  ],
};

const VEHICULOS = [
  { id: 5, patente: "AB123CD", modelo: { nombre: "Hilux" } },
  { id: 6, patente: "ZZ999ZZ", modelo: { nombre: "Ranger" } },
];

const CHOFERES = [
  { id: 10, nombre: "Juan", apellido: "Perez" },
  { id: 11, nombre: "Maria", apellido: "Gomez" },
];

describe("EditarViaje", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    viajeApi.getById.mockResolvedValue(EXISTING_VIAJE);
    viajeApi.update.mockResolvedValue({ id: 42 });
    vehiculoApi.getAll.mockResolvedValue(VEHICULOS);
    usuarioApi.getChoferes.mockResolvedValue(CHOFERES);
  });

  it("prefills the vehículo, choferes and planned dates from the fetched viaje", async () => {
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(viajeApi.getById).toHaveBeenCalledWith("42");
    });

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });

    expect(screen.getAllByText("Juan Perez").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/salida planificada/i)).toHaveTextContent(
      "01/08/2026 09:00"
    );
    expect(screen.getByLabelText(/llegada planificada/i)).toHaveTextContent(
      "01/08/2026 17:00"
    );
  });

  it("submits the edited vehículo/choferes/fechas while keeping the existing envíos grouping", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });

    // Cambiar el vehículo seleccionado
    await user.click(screen.getByRole("combobox", { name: /^vehículo/i }));
    await user.click(await screen.findByText("ZZ999ZZ - Ranger"));

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(viajeApi.update).toHaveBeenCalledTimes(1);
    });

    const [calledId, payload] = viajeApi.update.mock.calls[0];
    expect(calledId).toBe("42");

    expect(payload.viaje).toEqual(
      expect.objectContaining({
        vehiculoID: 6,
        choferesID: [10],
        fechaHoraInicio: EXISTING_VIAJE.fechaHoraInicio,
        fechaHoraFin: EXISTING_VIAJE.fechaHoraFin,
      })
    );

    expect(payload.enviosPuntoEntrega).toEqual([
      { enviosID: [200, 201], puntoEntregaID: 3, sucursalDestinoID: null },
      { enviosID: [202], puntoEntregaID: null, sucursalDestinoID: 7 },
    ]);
  });
});
