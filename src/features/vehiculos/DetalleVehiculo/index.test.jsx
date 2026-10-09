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

  it("indica 'En mantenimiento hasta el …' con el campo mantenimiento del vehículo, sin consultar mantenimientos (SHG-FE-118)", async () => {
    mockGetById.mockResolvedValue({
      id: 1,
      patente: "AB123CD",
      mantenimiento: {
        id: 3,
        fechaHoraMantenimiento: "2020-01-01T08:00:00",
        fechaHoraFin: "2099-12-31T18:30:00.000",
        vigente: true,
      },
    });
    renderDetalle();
    expect(
      await screen.findByText("En mantenimiento hasta el 31/12/2099 18:30"),
    ).toBeInTheDocument();
    expect(mockGetById).toHaveBeenCalledTimes(1);
  });

  it("indica 'Mantenimiento programado …' si el mantenimiento es el próximo (vigente: false)", async () => {
    mockGetById.mockResolvedValue({
      id: 1,
      patente: "AB123CD",
      mantenimiento: {
        id: 4,
        fechaHoraMantenimiento: "2099-12-30T08:00:00.000",
        fechaHoraFin: "2099-12-31T18:30:00.000",
        vigente: false,
      },
    });
    renderDetalle();
    expect(
      await screen.findByText(
        "Mantenimiento programado del 30/12/2099 08:00 al 31/12/2099 18:30",
      ),
    ).toBeInTheDocument();
  });

  it("sin el campo mantenimiento no muestra el indicador", async () => {
    mockGetById.mockResolvedValue({ id: 1, patente: "AB123CD" });
    renderDetalle();
    await screen.findByText("AB123CD");
    expect(screen.queryByText(/mantenimiento (hasta|programado)/i)).not.toBeInTheDocument();
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
    expect(mockGetById).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("No se pudo cargar la información del vehículo")).not.toBeInTheDocument();
  });

  it('no muestra "Ver mantenimientos" mientras no hay patente disponible', async () => {
    mockGetById.mockResolvedValue({ id: 1, patente: "" });

    renderDetalle();

    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Ver mantenimientos" })).not.toBeInTheDocument();
  });
});
