import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { AppShell, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return { ...actual, useLocation: () => ["/mantenimientos/5/editar", mockNavigate] };
});

const mockUpdate = vi.fn();

vi.mock("../../api/mantenimientos.api", () => ({
  mantenimientoApi: { update: (...args) => mockUpdate(...args) },
  tipoMantenimientoApi: { getAll: vi.fn().mockResolvedValue([{ id: 4, nombre: "Frenos" }]) },
}));

vi.mock("@api", () => ({
  vehiculoApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: 12, patente: "AB123CD", modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } } },
    ]),
  },
}));

import EditarMantenimientoForm from "./EditarMantenimientoForm";

const inicio = dayjs().add(2, "day").hour(8).minute(0).second(0);
const fin = dayjs().add(3, "day").hour(18).minute(30).second(0);

const mantenimiento = {
  id: 5,
  nombreMecanico: "Ana",
  apellidoMecanico: "López",
  vehiculo: { id: 12, patente: "AB123CD" },
  tipoMantenimiento: { id: 4, nombre: "Frenos" },
  fechaHoraMantenimiento: inicio.format("YYYY-MM-DDTHH:mm:ss"),
  fechaHoraFin: fin.format("YYYY-MM-DDTHH:mm:ss.000"),
  fechaHoraRegistro: "2026-10-01T10:00:00",
  descripcion: "",
};

const renderForm = () =>
  render(
    <MantineProvider>
      <Notifications />
      <AppShell footer={{ height: 60 }}>
        <EditarMantenimientoForm id="5" mantenimiento={mantenimiento} />
      </AppShell>
    </MantineProvider>,
  );

describe("EditarMantenimientoForm (SHG-FE-115)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("precarga Desde y Hasta del mantenimiento en DD/MM/YYYY 24 h", async () => {
    renderForm();
    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByText(inicio.format("DD/MM/YYYY HH:mm"))).toBeInTheDocument();
    expect(screen.getByText(fin.format("DD/MM/YYYY HH:mm"))).toBeInTheDocument();
  });

  it("manda fechaHoraFin al backend y muestra tal cual el 409 de solape con un viaje", async () => {
    const message =
      "El vehículo AB123CD tiene el viaje #12 planificado del 10/10/2026 08:00 al 10/10/2026 18:00, que se solapa con el mantenimiento.";
    mockUpdate.mockRejectedValue({
      response: { status: 409, data: { statusCode: 409, message } },
    });
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Ana");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    const [id, payload] = mockUpdate.mock.calls[0];
    expect(id).toBe("5");
    expect(payload.fechaHoraFin).toBe(fin.format("YYYY-MM-DDTHH:mm:ss"));
    expect(payload.fechaHoraMantenimiento).toBe(inicio.format("YYYY-MM-DDTHH:mm:ss"));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
