import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useLocation: () => ["/vehiculos/1", mockNavigate],
  };
});

const mockGetById = vi.fn();

vi.mock("@api", () => ({
  vehiculoApi: {
    getById: (...args) => mockGetById(...args),
  },
}));

import DetalleVehiculo from "./index";

const renderDetalle = () =>
  render(
    <MantineProvider>
      <DetalleVehiculo />
      <Notifications />
    </MantineProvider>,
  );

describe("DetalleVehiculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('"Ver mantenimientos" navega al historial filtrado por patente (SHG-FE-098)', async () => {
    mockGetById.mockResolvedValue({
      id: 1,
      patente: "AB123CD",
      modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
    });

    const user = userEvent.setup();
    renderDetalle();

    const boton = await screen.findByRole("button", { name: "Ver mantenimientos" });
    await user.click(boton);

    expect(mockNavigate).toHaveBeenCalledWith("~/mantenimientos?patente=AB123CD");
  });

  it("un 404 muestra 'Vehículo no encontrado' con link al listado, sin toast ni redirección (SHG-FE-104)", async () => {
    mockGetById.mockRejectedValue(
      Object.assign(new Error("Not found"), { response: { status: 404 } }),
    );

    renderDetalle();

    expect(await screen.findByText("Vehículo no encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a vehículos/i })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText("No se pudo cargar la información del vehículo")).not.toBeInTheDocument();
  });

  it('no muestra "Ver mantenimientos" mientras no hay patente disponible', async () => {
    mockGetById.mockResolvedValue({ id: 1, patente: "" });

    renderDetalle();

    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Ver mantenimientos" })).not.toBeInTheDocument();
  });
});
