import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useParams: () => ({ id: "99" }),
    useLocation: () => ["/mantenimientos/99", mockNavigate],
  };
});

const mockGetById = vi.fn();

vi.mock("../api/mantenimientos.api", () => ({
  mantenimientoApi: { getById: (...args) => mockGetById(...args) },
}));

import DetalleMantenimiento from "./index";

describe("DetalleMantenimiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("un 404 muestra 'Mantenimiento no encontrado' con link al listado, con un solo GET y sin toasts (SHG-FE-104)", async () => {
    mockGetById.mockRejectedValue(
      Object.assign(new Error("Not found"), { response: { status: 404 } }),
    );

    render(
      <MantineProvider>
        <DetalleMantenimiento />
        <Notifications />
      </MantineProvider>,
    );

    expect(await screen.findByText("Mantenimiento no encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a mantenimientos/i })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
    expect(mockGetById).toHaveBeenCalledTimes(1);
  });
});
