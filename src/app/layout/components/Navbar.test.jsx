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
const renderNavbar = () =>
  renderWithProviders(
    <AppShell navbar={{ width: 260 }}>
      <AppNavbar />
    </AppShell>
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
