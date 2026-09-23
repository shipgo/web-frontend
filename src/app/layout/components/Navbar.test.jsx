import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, MantineProvider } from "@mantine/core";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import AppNavbar from "./Navbar";

// AppShellNavbar requires an AppShell ancestor to read layout context from.
const renderNavbar = () =>
  renderWithProviders(
    <AppShell navbar={{ width: 260 }}>
      <AppNavbar />
    </AppShell>
  );

// Clave interna que usa el `localStorageColorSchemeManager` de Mantine para
// persistir la preferencia entre sesiones (misma que lee `routes/index.jsx`).
const MANTINE_COLOR_SCHEME_STORAGE_KEY = "mantine-color-scheme-value";

// Reproduce el mismo `MantineProvider` raíz que `App.jsx`
// (`defaultColorScheme="auto"`) — el bug de SHG-FE-077 sólo aparece con
// "auto" como default, `renderWithProviders` no lo configura así.
const renderNavbarWithAutoScheme = () =>
  render(
    <MantineProvider defaultColorScheme="auto">
      <AppShell navbar={{ width: 260 }}>
        <AppNavbar />
      </AppShell>
    </MantineProvider>
  );

const mockMatchMediaPrefersDark = (prefersDark) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: prefersDark && query === "(prefers-color-scheme: dark)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe("AppNavbar", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("un ADMIN ve Usuarios/Vehículos/Mantenimientos pero no Sucursales", () => {
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_ADMIN" }] } });
    renderNavbar();

    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Vehículos")).toBeInTheDocument();
    expect(screen.getByText("Marcas y Modelos")).toBeInTheDocument();
    expect(screen.getByText("Mantenimientos")).toBeInTheDocument();
    expect(screen.queryByText("Sucursales")).not.toBeInTheDocument();
  });

  it("un SUPERUSER ve también Sucursales", () => {
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_SUPERUSER" }] } });
    renderNavbar();

    expect(screen.getByText("Sucursales")).toBeInTheDocument();
  });

  it("siempre muestra Dashboard/Viajes/Envios para roles web", () => {
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_ADMIN" }] } });
    renderNavbar();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Viajes")).toBeInTheDocument();
    expect(screen.getByText("Envios")).toBeInTheDocument();
  });
});

describe("AppNavbar — toggle de tema (SHG-FE-077)", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_ADMIN" }] } });
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  it("con el SO en modo oscuro y sin preferencia guardada, muestra 'Modo oscuro' desde el primer render", () => {
    mockMatchMediaPrefersDark(true);
    renderNavbarWithAutoScheme();

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.queryByText("Modo claro")).not.toBeInTheDocument();
  });

  it("con el SO en modo claro y sin preferencia guardada, muestra 'Modo claro' desde el primer render", () => {
    mockMatchMediaPrefersDark(false);
    renderNavbarWithAutoScheme();

    expect(screen.getByText("Modo claro")).toBeInTheDocument();
    expect(screen.queryByText("Modo oscuro")).not.toBeInTheDocument();
  });

  it("un solo click alterna el tema y actualiza la etiqueta en el mismo click (arrancando en 'auto'/oscuro)", async () => {
    const user = userEvent.setup();
    mockMatchMediaPrefersDark(true);
    renderNavbarWithAutoScheme();

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();

    await user.click(screen.getByText("Modo oscuro"));

    expect(screen.getByText("Modo claro")).toBeInTheDocument();
    expect(screen.queryByText("Modo oscuro")).not.toBeInTheDocument();
  });

  it("respeta una preferencia explícita guardada de una sesión previa y alterna en un solo click", async () => {
    const user = userEvent.setup();
    // El SO dice "claro" pero el usuario ya había elegido "oscuro" antes.
    mockMatchMediaPrefersDark(false);
    window.localStorage.setItem(MANTINE_COLOR_SCHEME_STORAGE_KEY, "dark");
    renderNavbarWithAutoScheme();

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();

    await user.click(screen.getByText("Modo oscuro"));

    expect(screen.getByText("Modo claro")).toBeInTheDocument();
  });
});
