import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import PortalRoute from "./PortalRoute";

const renderRoute = (route = "/portal/envios") =>
  renderWithProviders(
    <PortalRoute>
      <div>Contenido del portal</div>
    </PortalRoute>,
    { route }
  );

describe("PortalRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("sin sesión redirige a /login", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });
    renderRoute();
    expect(window.location.pathname).toBe("/login");
    expect(screen.queryByText("Contenido del portal")).not.toBeInTheDocument();
  });

  it("un ADMIN es redirigido a su panel (/)", () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: "ROLE_ADMIN" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderRoute();
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByText("Contenido del portal")).not.toBeInTheDocument();
  });

  it("un CUSTOMER accede al portal", () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: "ROLE_CUSTOMER" }] },
      isLoading: false,
      isAuthenticated: true,
    });
    renderRoute();
    expect(screen.getByText("Contenido del portal")).toBeInTheDocument();
  });
});
