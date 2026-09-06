import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
  useIsAuthenticated: () => mockUseAuth().isAuthenticated,
}));

vi.mock("../layout", () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

vi.mock("../layout/PublicLayout", () => ({
  default: ({ children }) => <div data-testid="public-layout">{children}</div>,
}));

vi.mock("@features/tracking", () => ({
  TrackingPublicoPage: () => <div>Tracking publico</div>,
}));

vi.mock("@components/MobileOnlyScreen", () => ({
  default: () => <div>Pantalla usá la app</div>,
}));

vi.mock("@features/login", () => ({ default: () => <div>Login</div> }));
vi.mock("@features/login/RecuperarCuenta", () => ({
  default: () => <div>RecuperarCuenta</div>,
}));
vi.mock("@features/login/RecuperarCuentaToken", () => ({
  default: () => <div>RecuperarCuentaToken</div>,
}));
vi.mock("@features/home", () => ({ default: () => <div>Home</div> }));
vi.mock("@features/mapa", () => ({ default: () => <div>Mapa</div> }));
vi.mock("@features/mantenimientos", () => ({
  default: () => <div>Mantenimientos</div>,
}));
vi.mock("./dashboard.routes", () => ({ default: () => <div>Dashboard</div> }));
vi.mock("./envios.routes", () => ({ default: () => <div>Envios</div> }));
vi.mock("./viajes.routes", () => ({ default: () => <div>Viajes</div> }));
vi.mock("./usuarios.routes", () => ({ default: () => <div>Usuarios</div> }));
vi.mock("./sucursales.routes", () => ({ default: () => <div>Sucursales</div> }));
vi.mock("@features/vehiculos", () => ({ default: () => <div>Vehiculos</div> }));

import AppRoutes from "./index";

const setAuth = (auth) => mockUseAuth.mockReturnValue(auth);

describe("AppRoutes", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("no autenticado en una ruta protegida termina en /login", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/envios" });

    expect(await screen.findByText("Login")).toBeInTheDocument();
  });

  it("CHOFER ve la pantalla 'usá la app' sin el layout de gestión", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_CHOFER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/" });

    expect(await screen.findByText("Pantalla usá la app")).toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
  });

  it("ADMIN accede a /envios dentro del layout", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/envios" });

    expect(await screen.findByText("Envios")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("ADMIN entrando a /sucursales (SUPERUSER-only) es redirigido a Home", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/sucursales" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Sucursales")).not.toBeInTheDocument();
  });

  it("sin sesión, /recuperar-cuenta renderiza la pantalla pública", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/recuperar-cuenta" });

    expect(await screen.findByText("RecuperarCuenta")).toBeInTheDocument();
  });

  it("sin sesión, /recuperar-cuenta/:token renderiza la pantalla de token", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/recuperar-cuenta/abc123" });

    expect(await screen.findByText("RecuperarCuentaToken")).toBeInTheDocument();
  });

  it("con sesión, /recuperar-cuenta redirige al Home", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/recuperar-cuenta" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("RecuperarCuenta")).not.toBeInTheDocument();
  });

  it("sin sesión, /tracking NO redirige a login (ruta pública, fuera de ProtectedRoutes)", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/tracking" });

    expect(await screen.findByText("Tracking publico")).toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    // Sin el AppShell de gestión.
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
    expect(screen.getByTestId("public-layout")).toBeInTheDocument();
  });

  it("sin sesión, /tracking/:codigo renderiza la vista pública de tracking", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/tracking/7K2M9QX4TP" });

    expect(await screen.findByText("Tracking publico")).toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("con sesión, /tracking sigue siendo accesible (no redirige al Home)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/tracking" });

    expect(await screen.findByText("Tracking publico")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("SUPERUSER accede a /sucursales", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_SUPERUSER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/sucursales" });

    expect(await screen.findByText("Sucursales")).toBeInTheDocument();
  });
});
