import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";
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

  it("clickear el trigger abre el spotlight", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ user: adminUser });
    const openSpy = vi.spyOn(spotlight, "open");
    renderHeader();

    await user.click(screen.getByText("Buscar o navegar..."));

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("no renderiza nada si no hay usuario autenticado", () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = renderHeader();

    expect(container.querySelector("header")).not.toBeInTheDocument();
  });
});
