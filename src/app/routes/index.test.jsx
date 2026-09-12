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

vi.mock("@features/landing", () => ({
  LandingPage: () => <div>Landing</div>,
}));

vi.mock("@features/portal", () => ({
  RegistroPage: () => <div>Registro</div>,
  VerificarCuentaPage: () => <div>Verificar cuenta</div>,
  PortalLayout: ({ children }) => (
    <div data-testid="portal-layout">{children}</div>
  ),
}));
vi.mock("./portal.routes", () => ({ default: () => <div>Portal envios</div> }));

vi.mock("@components/MobileOnlyScreen", () => ({
  default: () => <div>Pantalla usá la app</div>,
}));

vi.mock("@features/login", () => ({
  default: ({ variant = "operator" }) => <div>Login:{variant}</div>,
}));
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
vi.mock("./catalogoVehiculos.routes", () => ({
  default: () => <div>CatalogoVehiculos</div>,
}));

import AppRoutes from "./index";

const setAuth = (auth) => mockUseAuth.mockReturnValue(auth);

describe("AppRoutes", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("no autenticado en una ruta protegida termina en /login preservando el destino en ?redirect= (SHG-FE-054)", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/envios/123" });

    expect(await screen.findByText("Login:operator")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(window.location.search).toBe("?redirect=%2Fenvios%2F123");
  });

  it("no autenticado en /portal/envios (guarda distinta, PortalRoute) también preserva el destino", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/portal/envios" });

    expect(await screen.findByText("Login:operator")).toBeInTheDocument();
    expect(window.location.search).toBe("?redirect=%2Fportal%2Fenvios");
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

  it("CARGA (igual que CHOFER: sólo mobile, CONTRACTS.md §3) también ve la pantalla 'usá la app'", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_CARGA" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/envios" });

    expect(await screen.findByText("Pantalla usá la app")).toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
    expect(screen.queryByText("Envios")).not.toBeInTheDocument();
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

  it("ADMIN (no sólo SUPERUSER) accede a /catalogo-vehiculos", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/catalogo-vehiculos" });

    expect(await screen.findByText("CatalogoVehiculos")).toBeInTheDocument();
  });

  // --- Portal CUSTOMER (SHG-FE-026) ---

  it("sin sesión, /registro renderiza el registro público (sin AppShell de admin)", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/registro" });

    expect(await screen.findByText("Registro")).toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
    expect(screen.getByTestId("public-layout")).toBeInTheDocument();
  });

  it("con sesión, /registro redirige (no muestra el registro)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/registro" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Registro")).not.toBeInTheDocument();
  });

  it("/registro/verificar renderiza la pantalla de verificación sin sesión", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/registro/verificar" });

    expect(await screen.findByText("Verificar cuenta")).toBeInTheDocument();
  });

  it("con sesión, /registro/verificar redirige (no muestra la verificación)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/registro/verificar" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Verificar cuenta")).not.toBeInTheDocument();
  });

  it("un CUSTOMER accede a /portal/envios con su layout propio", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_CUSTOMER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/portal/envios" });

    expect(await screen.findByText("Portal envios")).toBeInTheDocument();
    expect(screen.getByTestId("portal-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
  });

  it("un CUSTOMER que cae en una ruta de gestión es redirigido al portal", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_CUSTOMER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/envios" });

    expect(await screen.findByText("Portal envios")).toBeInTheDocument();
    expect(screen.queryByText("Envios")).not.toBeInTheDocument();
  });

  it("un ADMIN que cae en /portal es redirigido a su panel", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/portal/envios" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Portal envios")).not.toBeInTheDocument();
  });

  // --- Landing pública (SHG-FE-044) ---

  it("sin sesión, / sirve la landing pública (no redirige a /login)", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/" });

    expect(await screen.findByText("Landing")).toBeInTheDocument();
    expect(screen.queryByText(/^Login/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument();
  });

  it("con sesión, un ADMIN en / ve su Home (no la landing)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Landing")).not.toBeInTheDocument();
  });

  it("con sesión, un CUSTOMER en / es redirigido al portal (no la landing)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_CUSTOMER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/" });

    expect(await screen.findByText("Portal envios")).toBeInTheDocument();
    expect(screen.queryByText("Landing")).not.toBeInTheDocument();
  });

  // --- Entrada dedicada del customer (SHG-FE-044) ---

  it("sin sesión, /portal/ingresar renderiza el login en variante customer", async () => {
    setAuth({ user: null, isLoading: false, isAuthenticated: false });
    renderWithProviders(<AppRoutes />, { route: "/portal/ingresar" });

    expect(await screen.findByText("Login:customer")).toBeInTheDocument();
  });

  it("con sesión, /portal/ingresar redirige al home por rol (no muestra el login)", async () => {
    setAuth({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderWithProviders(<AppRoutes />, { route: "/portal/ingresar" });

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Login:customer")).not.toBeInTheDocument();
  });
});
