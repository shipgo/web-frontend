import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import PublicRoute from "./PublicRoute";

const renderRoute = (route = "/recuperar-cuenta") =>
  renderWithProviders(
    <PublicRoute>
      <div>Contenido público</div>
    </PublicRoute>,
    { route }
  );

describe("PublicRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("muestra un loader mientras isLoading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });
    renderRoute();
    expect(screen.queryByText("Contenido público")).not.toBeInTheDocument();
  });

  it("renderiza el contenido cuando no hay sesión", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    renderRoute();
    expect(screen.getByText("Contenido público")).toBeInTheDocument();
  });

  it("redirige al Home si ya hay sesión iniciada", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1 },
      isLoading: false,
      isAuthenticated: true,
    });
    renderRoute();
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByText("Contenido público")).not.toBeInTheDocument();
  });
});
