import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: "",
}));

vi.mock("@api/viaje.api", () => ({
  viajeApi: { get: vi.fn(), cancelar: vi.fn(), delete: vi.fn() },
}));

import { viajeApi } from "@api/viaje.api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import ListaViajes from "./index";

const VIAJE = {
  id: 42,
  estado: "planificado",
  fechaHoraInicioPlanificada: "2020-09-10T09:00:00",
  vehiculo: { id: 5, patente: "AB123CD" },
  chofer: null,
  choferes: [{ id: 10, nombre: "Juan", apellido: "Perez" }],
  recorridos: [
    { id: 1, detalleRecorridos: [{ id: 100 }, { id: 101 }] },
    { id: 2, detalleRecorridos: [{ id: 102 }] },
  ],
};

describe("ListaViajes en mobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: "admin1", authorities: ["ROLE_ADMIN"] }),
      isAuthenticated: true,
    });
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });
  });

  it("muestra tarjetas en vez de tabla, con los datos clave y la alerta de retraso", async () => {
    renderWithProviders(<ListaViajes />);

    expect(await screen.findByText("Viaje #42")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("list-card")).toHaveLength(1);
    expect(screen.getByText("Planificado")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("AB123CD")).toBeInTheDocument();
    expect(screen.getByText("2 recorridos · 3 envíos")).toBeInTheDocument();
    expect(screen.getByLabelText("Viaje retrasado")).toBeInTheDocument();
  });

  it("la acción principal es un ícono y Exportar CSV queda en el menú", async () => {
    renderWithProviders(<ListaViajes />);
    await screen.findByText("Viaje #42");

    expect(screen.getByRole("link", { name: "Crear viaje" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });

  it("los filtros viven en una hoja y los chips quedan afuera", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaViajes />);
    await screen.findByText("Viaje #42");

    expect(screen.getByTestId("quick-filters")).toBeInTheDocument();
    expect(screen.queryByText("Rango de fechas")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Filtros/ }));
    expect(await screen.findByText("Rango de fechas")).toBeInTheDocument();
    expect(screen.getByText("Estados")).toBeInTheDocument();
  });

  it("seleccionar una tarjeta muestra el banner de selección", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaViajes />);
    await screen.findByText("Viaje #42");

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar viaje 42" }));
    await waitFor(() => expect(screen.getByText(/1 viaje seleccionado/i)).toBeInTheDocument());
  });
});
