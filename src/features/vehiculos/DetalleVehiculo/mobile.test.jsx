import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => true, MOBILE_QUERY: "" }));

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return { ...actual, useParams: () => ({ id: "1" }), useLocation: () => ["/vehiculos/1", mockNavigate] };
});

const mockNavigate = vi.fn();
const mockGetById = vi.fn();
vi.mock("@api", () => ({
  mantenimientoApi: { get: vi.fn() },
  vehiculoApi: { getById: (...args) => mockGetById(...args) },
}));

import DetalleVehiculo from "./index";

describe("DetalleVehiculo en mobile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Editar va en la barra fija y las secciones son un acordeón", async () => {
    mockGetById.mockResolvedValue({ id: 1, patente: "AB123CD" });
    render(
      <MantineProvider>
        <DetalleVehiculo />
      </MantineProvider>,
    );

    const bar = await screen.findByTestId("sticky-action-bar");
    expect(bar).toHaveTextContent("Editar");
    expect(screen.getByRole("button", { name: /Especificaciones técnicas/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Ruedas y capacidad/ })).toHaveAttribute("aria-expanded", "false");
  });
});
