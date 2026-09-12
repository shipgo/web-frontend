import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockBuscar = vi.fn();
vi.mock("@api/buscar.api", () => ({
  buscarApi: {
    buscar: (...args) => mockBuscar(...args),
  },
}));

import NavigationSpotlight from "./NavigationSpotlight";

const SEARCH_PLACEHOLDER = "Buscá una sección, envío, viaje, patente...";

const adminUser = { authorities: [{ name: "ROLE_ADMIN" }] };
const superuserUser = { authorities: [{ name: "ROLE_SUPERUSER" }] };
const choferUser = { authorities: [{ name: "ROLE_CHOFER" }] };

const renderSpotlight = (user = adminUser) => {
  mockUseAuth.mockReturnValue({ user });
  return renderWithProviders(<NavigationSpotlight forceOpened />);
};

const buscarResponseVacia = {
  envios: [],
  viajes: [],
  usuarios: [],
  vehiculos: [],
  sucursales: [],
};

describe("NavigationSpotlight", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockBuscar.mockReset();
  });

  it("navega a una sección estática sin pegarle a la red", async () => {
    const user = userEvent.setup();
    renderSpotlight(adminUser);

    await user.click(screen.getByText("Envios"));

    await waitFor(() => expect(window.location.pathname).toBe("/envios"));
    expect(mockBuscar).not.toHaveBeenCalled();
  });

  it("un ADMIN ve Usuarios/Vehículos/Mantenimientos pero no Sucursales en la navegación", () => {
    renderSpotlight(adminUser);

    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Vehículos")).toBeInTheDocument();
    expect(screen.getByText("Mantenimientos")).toBeInTheDocument();
    expect(screen.queryByText("Sucursales")).not.toBeInTheDocument();
  });

  it("un SUPERUSER ve también Sucursales en la navegación", () => {
    renderSpotlight(superuserUser);

    expect(screen.getByText("Sucursales")).toBeInTheDocument();
  });

  it("un rol sin acceso al panel web (CHOFER) sólo ve Inicio/Mapa y no dispara /api/buscar", async () => {
    const user = userEvent.setup();
    renderSpotlight(choferUser);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Mapa")).toBeInTheDocument();
    expect(screen.queryByText("Envios")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "SEED000001");

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockBuscar).not.toHaveBeenCalled();
  });

  it("con menos de 2 caracteres no consulta /api/buscar", async () => {
    const user = userEvent.setup();
    renderSpotlight(adminUser);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "S");

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockBuscar).not.toHaveBeenCalled();
  });

  it("tipear >= 2 caracteres consulta /api/buscar (debounced) y agrupa resultados; seleccionar uno navega al detalle", async () => {
    const user = userEvent.setup();
    mockBuscar.mockResolvedValue({
      ...buscarResponseVacia,
      envios: [
        { tipo: "envio", id: 1, label: "SEED000001", subtitle: "Juan Perez" },
      ],
      viajes: [
        { tipo: "viaje", id: 7, label: "Viaje #7", subtitle: "AA222AA · planificado" },
      ],
    });
    renderSpotlight(adminUser);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "SEED");

    await waitFor(() => expect(mockBuscar).toHaveBeenCalledWith({ q: "SEED" }), {
      timeout: 2000,
    });

    await waitFor(() => expect(screen.getByText("SEED000001")).toBeInTheDocument());
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("Viaje #7")).toBeInTheDocument();

    await user.click(screen.getByText("SEED000001"));

    await waitFor(() => expect(window.location.pathname).toBe("/envios/1"));
  });

  it("si /api/buscar falla, degrada a sólo navegación estática (sigue siendo usable)", async () => {
    const user = userEvent.setup();
    mockBuscar.mockRejectedValue(new Error("network error"));
    renderSpotlight(adminUser);

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    await user.type(searchInput, "SEED");

    await waitFor(() => expect(mockBuscar).toHaveBeenCalled(), { timeout: 2000 });

    await waitFor(() =>
      expect(
        screen.getByText(/no se pudo conectar con el buscador/i),
      ).toBeInTheDocument(),
    );

    // La navegación estática sigue funcionando pese al error de red (acá se
    // limpia la query para volver a ver la lista completa de secciones).
    await user.clear(searchInput);
    await user.click(screen.getByText("Usuarios"));
    await waitFor(() => expect(window.location.pathname).toBe("/usuarios"));
  });

  it("sin resultados dinámicos muestra el estado 'sin resultados' explícito", async () => {
    const user = userEvent.setup();
    mockBuscar.mockResolvedValue(buscarResponseVacia);
    renderSpotlight(adminUser);

    await user.type(
      screen.getByPlaceholderText(SEARCH_PLACEHOLDER),
      "xyzxyznotfound",
    );

    await waitFor(() => expect(mockBuscar).toHaveBeenCalled(), { timeout: 2000 });

    await waitFor(() =>
      expect(screen.getByText(/sin resultados para/i)).toBeInTheDocument(),
    );
  });
});
