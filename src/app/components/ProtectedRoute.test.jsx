import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import ProtectedRoute from "./ProtectedRoute";

const renderRoute = (roles, route = "/envios") =>
  renderWithProviders(
    <ProtectedRoute roles={roles}>
      <div>Contenido protegido</div>
    </ProtectedRoute>,
    { route }
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("muestra un loader mientras isLoading", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, isAuthenticated: false });
    renderRoute();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige a /login si no está autenticado, preservando el destino en ?redirect= (SHG-FE-054)", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });
    renderRoute(undefined, "/envios");
    expect(window.location.pathname).toBe("/login");
    expect(window.location.search).toBe("?redirect=%2Fenvios");
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("permite el acceso cuando el rol del usuario está en la lista", () => {
    const user = { authorities: [{ name: "ROLE_ADMIN" }] };
    mockUseAuth.mockReturnValue({ user, isLoading: false, isAuthenticated: true });
    renderRoute(["ROLE_SUPERUSER", "ROLE_ADMIN"]);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("redirige a / cuando el rol del usuario no está permitido", () => {
    const user = { authorities: [{ name: "ROLE_ADMIN" }] };
    mockUseAuth.mockReturnValue({ user, isLoading: false, isAuthenticated: true });
    renderRoute(["ROLE_SUPERUSER"]);
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("sin `roles`, permite el acceso a cualquier usuario autenticado", () => {
    const user = { authorities: [{ name: "ROLE_CHOFER" }] };
    mockUseAuth.mockReturnValue({ user, isLoading: false, isAuthenticated: true });
    renderRoute();
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});
