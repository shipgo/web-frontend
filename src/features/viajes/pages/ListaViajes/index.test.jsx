import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api/viaje.api", () => ({
  viajeApi: { get: vi.fn() },
  detalleRecorridoApi: {},
}));

import { viajeApi } from "@api/viaje.api";
import ListaViajes from "./index";

const VIAJE = {
  id: 42,
  estado: "planificado",
  fechaHoraInicioPlanificada: "2026-09-10T09:00:00",
  vehiculo: { id: 5, patente: "AB123CD" },
  chofer: null,
  choferes: [{ id: 10, nombre: "Juan", apellido: "Perez" }],
  recorridos: [
    { id: 1, detalleRecorridos: [{ id: 100 }, { id: 101 }] },
    { id: 2, detalleRecorridos: [{ id: 102 }] },
  ],
};

describe("ListaViajes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los viajes devueltos por viajeApi.get con las columnas nuevas", async () => {
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalled());

    expect(await screen.findByText("AB123CD")).toBeInTheDocument();

    const table = within(screen.getByRole("table"));
    expect(table.getByText("Planificado")).toBeInTheDocument();
    expect(table.getByText("Juan Perez")).toBeInTheDocument();
    expect(table.getByText("2 recorridos · 3 envíos")).toBeInTheDocument();
  });

  it("no manda ningún filtro por defecto (sin quick-filter preseleccionada)", async () => {
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalled());

    const params = viajeApi.get.mock.calls[0][0];
    expect(params.page).toBe(0);
    expect(params.estado).toBeUndefined();
    expect(params.search).toBeUndefined();
  });

  it("clickear la fila navega al detalle del viaje", async () => {
    const user = userEvent.setup();
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    const row = await screen.findByText("AB123CD");
    await user.click(row);

    await waitFor(() => expect(window.location.pathname).toBe("/42"));
  });

  it("clickear 'En curso' vuelve a pedir los viajes con estado=en_camino", async () => {
    const user = userEvent.setup();
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaViajes />);
    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByText("En curso"));

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(2));
    const params = viajeApi.get.mock.calls.at(-1)[0];
    expect(params.estado).toEqual(["en_camino"]);
  });

  it("muestra el estado vacío cuando no hay viajes", async () => {
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaViajes />);

    expect(await screen.findByText("Sin viajes que mostrar")).toBeInTheDocument();
  });
});
