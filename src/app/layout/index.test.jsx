import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link } from "wouter";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockUseAuth = vi.fn();
vi.mock("@contexts/auth", () => ({ useAuth: () => mockUseAuth() }));

const mockLogout = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: () => ({ logout: mockLogout }),
}));

vi.mock("@features/notificaciones", () => ({
  NotificacionesBell: () => <div data-testid="notificaciones-bell" />,
}));
vi.mock("@components", () => ({
  OperatingSucursalSelector: () => null,
}));
vi.mock("@components/OperatingSucursalSelector", () => ({
  default: () => <div data-testid="sucursal-selector" />,
}));

import Layout from "./index";

const originalMatchMedia = window.matchMedia;

// jsdom no resuelve media queries: simula un viewport mobile (< sm).
const mockViewport = ({ mobile }) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: mobile && query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const superUser = {
  id: 7,
  nombre: "Ada",
  apellido: "Lovelace",
  authorities: [{ name: "ROLE_SUPERUSER" }],
  sucursal: { id: 1 },
};

const renderLayout = () =>
  renderWithProviders(
    <Layout>
      <Link to="/envios">ir a envíos</Link>
    </Layout>,
  );

describe("Layout — cajón de navegación mobile", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: superUser });
    mockLogout.mockReset();
    mockViewport({ mobile: true });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const burger = () => screen.getByRole("button", { name: /abrir menú|cerrar menú/i });

  it("arranca cerrado: el burger anuncia aria-expanded=false y el menú está inerte", () => {
    renderLayout();

    expect(burger()).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("app-navbar")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByTestId("menu-scrim")).not.toBeInTheDocument();
  });

  it("el burger abre y cierra el cajón", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(burger());
    expect(burger()).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("app-navbar")).not.toHaveAttribute("aria-hidden");
    expect(screen.getByTestId("menu-scrim")).toBeInTheDocument();

    await user.click(screen.getByTestId("menu-scrim"));
    expect(burger()).toHaveAttribute("aria-expanded", "false");
  });

  it("el cajón tiene sucursal (superusuario), 'Mi perfil' y 'Cerrar sesión'", async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue();
    renderLayout();
    await user.click(burger());

    const navbar = document.getElementById("app-navbar");
    expect(within(navbar).getByTestId("sucursal-selector")).toBeInTheDocument();
    expect(within(navbar).getByRole("link", { name: /mi perfil/i })).toHaveAttribute(
      "href",
      "/usuarios/7",
    );
    expect(within(navbar).getByRole("switch", { name: /modo oscuro/i })).toBeInTheDocument();

    await user.click(within(navbar).getByText("Cerrar sesión"));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("se cierra con Escape", async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(burger());

    await user.keyboard("{Escape}");

    expect(burger()).toHaveAttribute("aria-expanded", "false");
  });

  it("se cierra al navegar", async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(burger());
    expect(burger()).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("link", { name: "ir a envíos" }));

    expect(burger()).toHaveAttribute("aria-expanded", "false");
  });

  it("tocar un enlace del cajón lo cierra", async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(burger());

    await user.click(
      within(document.getElementById("app-navbar")).getByRole("link", { name: /^envíos$/i }),
    );

    expect(burger()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Layout — escritorio", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: superUser });
    mockViewport({ mobile: false });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("el navbar no se marca como oculto ni incluye el pie de usuario móvil", () => {
    renderLayout();

    const navbar = document.getElementById("app-navbar");
    expect(navbar).not.toHaveAttribute("aria-hidden");
    expect(within(navbar).queryByTestId("mobile-user-section")).not.toBeInTheDocument();
    expect(within(navbar).queryByTestId("sucursal-selector")).not.toBeInTheDocument();
  });
});
