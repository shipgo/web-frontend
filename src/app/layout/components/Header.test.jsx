import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { spotlight } from "@mantine/spotlight";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseAuthStore = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// El bell de notificaciones y el selector de sucursal operativa pegan a su
// propia API / contexto — no son objeto de este test (SHG-FE-053 sólo toca
// el buscador), así que se mockean para mantener el test hermético.
vi.mock("@features/notificaciones", () => ({
  NotificacionesBell: () => <div data-testid="notificaciones-bell" />,
}));
vi.mock("@components", () => ({
  OperatingSucursalSelector: () => <div data-testid="sucursal-selector" />,
}));

import AppHeader from "./Header";

const adminUser = {
  fullname: "Ada Lovelace",
  authorities: [{ name: "ROLE_ADMIN" }],
};

// AppShellHeader requires an AppShell ancestor to read layout context from
// (mismo patrón que Navbar.test.jsx).
const renderHeader = () =>
  renderWithProviders(
    <AppShell header={{ height: 70 }}>
      <AppHeader />
    </AppShell>,
  );

describe("AppHeader", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuthStore.mockReset();
    mockUseAuthStore.mockReturnValue({ logout: vi.fn() });
  });

  it("ya no muestra el buscador de ancho fijo anterior", () => {
    mockUseAuth.mockReturnValue({ user: adminUser });
    renderHeader();

    expect(
      screen.queryByPlaceholderText("Buscá envíos, viajes..."),
    ).not.toBeInTheDocument();
  });

  it("muestra el trigger del spotlight con el atajo Ctrl+K", () => {
    mockUseAuth.mockReturnValue({ user: adminUser });
    renderHeader();

    expect(screen.getByText("Buscar o navegar...")).toBeInTheDocument();
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("muestra el rol en español, no el valor crudo ROLE_*", () => {
    mockUseAuth.mockReturnValue({ user: adminUser });
    renderHeader();

    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.queryByText("ROLE_ADMIN")).not.toBeInTheDocument();
  });

  it("clickear el trigger abre el spotlight", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ user: adminUser });
    const openSpy = vi.spyOn(spotlight, "open");
    renderHeader();

    await user.click(screen.getByText("Buscar o navegar..."));

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("un usuario sin nombre ni apellido (SHG-BE-154) muestra su username, nunca 'undefined'", () => {
    mockUseAuth.mockReturnValue({
      user: {
        username: "nico@x.com",
        email: "nico@x.com",
        authorities: [{ name: "ROLE_SUPERUSER" }],
      },
    });
    const { container } = renderHeader();

    expect(container.textContent).not.toMatch(/undefined/);
    expect(screen.getByText("nico@x.com")).toBeInTheDocument();
  });

  it("no renderiza nada si no hay usuario autenticado", () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = renderHeader();

    expect(container.querySelector("header")).not.toBeInTheDocument();
  });
});

// Clave que usa el `localStorageColorSchemeManager` de Mantine (SHG-FE-077).
const MANTINE_COLOR_SCHEME_STORAGE_KEY = "mantine-color-scheme-value";

// Mismo `MantineProvider` raíz que `App.jsx` (`defaultColorScheme="auto"`).
const renderHeaderWithAutoScheme = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MantineProvider defaultColorScheme="auto" env="test">
        <AppShell header={{ height: 70 }}>
          <AppHeader />
        </AppShell>
      </MantineProvider>
    </QueryClientProvider>,
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

describe("AppHeader — menú del usuario (SHG-FE-134)", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuthStore.mockReset();
    mockUseAuthStore.mockReturnValue({ logout: vi.fn() });
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
    mockMatchMediaPrefersDark(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  const abrirMenu = async (user) => {
    await user.click(screen.getByText("Ada Lovelace"));
    await screen.findByRole("menu");
    await screen.findAllByRole("menuitem");
  };

  it("ofrece 'Mi perfil' (al detalle propio), el toggle de tema y 'Cerrar sesión'", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { ...adminUser, nombre: "Ada", apellido: "Lovelace", id: 42, sucursal: { id: 1 } },
    });
    renderHeaderWithAutoScheme();
    await abrirMenu(user);

    expect(screen.getByRole("menuitem", { name: /mi perfil/i })).toHaveAttribute(
      "href",
      "/usuarios/42",
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "Modo oscuro" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it("el Switch refleja el esquema, alterna con un click y el menú sigue abierto", async () => {
    const user = userEvent.setup();
    mockMatchMediaPrefersDark(true);
    mockUseAuth.mockReturnValue({
      user: { ...adminUser, nombre: "Ada", apellido: "Lovelace", id: 42, sucursal: { id: 1 } },
    });
    renderHeaderWithAutoScheme();
    await abrirMenu(user);

    const fila = () => screen.getByRole("menuitemcheckbox", { name: "Modo oscuro" });
    expect(fila()).toHaveAttribute("aria-checked", "true");

    await user.click(fila());

    expect(fila()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menu")).toBeVisible();

    await user.click(fila());

    expect(fila()).toHaveAttribute("aria-checked", "true");
  });

  it("respeta una preferencia guardada 'dark' aunque el SO sea claro", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(MANTINE_COLOR_SCHEME_STORAGE_KEY, "dark");
    mockUseAuth.mockReturnValue({
      user: { ...adminUser, nombre: "Ada", apellido: "Lovelace", id: 42, sucursal: { id: 1 } },
    });
    renderHeaderWithAutoScheme();
    await abrirMenu(user);

    expect(screen.getByRole("menuitemcheckbox", { name: "Modo oscuro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("sin empresa no ofrece 'Mi perfil' pero sí el toggle de tema y 'Cerrar sesión'", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { ...adminUser, nombre: "Ada", apellido: "Lovelace", id: 42, authorities: [{ name: "ROLE_SUPERUSER" }], sucursal: null },
    });
    renderHeaderWithAutoScheme();
    await abrirMenu(user);

    expect(screen.queryByRole("menuitem", { name: /mi perfil/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Modo oscuro" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});
