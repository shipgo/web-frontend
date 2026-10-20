import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { AppShell } from "@mantine/core";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import AppNavbar from "./Navbar";

// AppShellNavbar requires an AppShell ancestor to read layout context from.
const renderNavbar = (options) =>
  renderWithProviders(
    <AppShell navbar={{ width: 260 }}>
      <AppNavbar />
    </AppShell>,
    options,
  );

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
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_SUPERUSER" }], sucursal: { id: 1 } } });
    renderNavbar();

    expect(screen.getByText("Sucursales")).toBeInTheDocument();
  });

  it("un SUPERUSER sin empresa (SHG-FE-116) sólo ve 'Configurá tu empresa', sin secciones de gestión", () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: "ROLE_SUPERUSER" }], sucursal: null },
    });
    renderNavbar();

    expect(screen.getByText("Configurá tu empresa")).toBeInTheDocument();
    for (const label of ["Home", "Mapa", "Envíos", "Viajes", "Usuarios", "Sucursales"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("siempre muestra Dashboard/Viajes/Envios para roles web", () => {
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: "ROLE_ADMIN" }] } });
    renderNavbar();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Viajes")).toBeInTheDocument();
    expect(screen.getByText("Envíos")).toBeInTheDocument();
  });

  // SHG-FE-134: "Mi perfil" y el toggle de tema viven en el menú del avatar.
  it("ya no contiene 'Mi perfil' ni el toggle de tema, y deja 'Manual' fijo abajo", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 42, authorities: [{ name: "ROLE_ADMIN" }] },
    });
    renderNavbar();

    expect(screen.queryByText("Mi perfil")).not.toBeInTheDocument();
    expect(screen.queryByText("Modo claro")).not.toBeInTheDocument();
    expect(screen.queryByText("Modo oscuro")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manual/i })).toHaveAttribute(
      "href",
      "https://shipgo.gitbook.io/manual",
    );
  });

  it("en el perfil propio 'Usuarios' no queda activo; en /usuarios sí", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 42, authorities: [{ name: "ROLE_ADMIN" }] },
    });
    const { unmount } = renderNavbar({ route: "/usuarios/42" });
    expect(screen.getByRole("link", { name: /usuarios/i })).not.toHaveAttribute("data-active");
    unmount();

    renderNavbar({ route: "/usuarios" });
    expect(screen.getByRole("link", { name: /usuarios/i })).toHaveAttribute("data-active", "true");
  });
});
