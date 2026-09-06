import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "wouter";

import { renderWithProviders as renderRaw } from "../../../test/renderWithProviders";

// El `Footer` canónico usa `AppShellFooter`, que requiere un `<AppShell>`
// ancestro (lo provee `src/app/layout` en la app real).
const renderWithProviders = (ui, options) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>, options);

vi.mock("@api/vehiculo.api", () => ({
  vehiculoApi: {
    get: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  marcaApi: { getAll: vi.fn() },
  modeloApi: { getAll: vi.fn() },
  tipoVehiculoApi: { getAll: vi.fn() },
  combustibleApi: { getAll: vi.fn() },
  tipoRuedaApi: { getAll: vi.fn() },
}));

import {
  vehiculoApi,
  marcaApi,
  modeloApi,
  tipoVehiculoApi,
  combustibleApi,
  tipoRuedaApi,
} from "@api/vehiculo.api";
import EditarVehiculo from "./index";

const EXISTING_VEHICULO = {
  id: 7,
  patente: "AB123CD",
  tipoVehiculo: { id: 1, nombre: "Camión" },
  modelo: { id: 3, nombre: "Hilux", marca: { id: 2, nombre: "Toyota" } },
  combustible: { id: 4, nombre: "Diésel" },
  tipoRueda: { id: 5, nombre: "Simple" },
  anioCompra: 2020,
  kilometraje: 50000,
  cantidadRuedas: 4,
  pesoMaximo: 1500,
  consumoPromedio: 8.5,
};

describe("EditarVehiculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    tipoVehiculoApi.getAll.mockResolvedValue([{ id: 1, nombre: "Camión" }]);
    marcaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Toyota" }]);
    modeloApi.getAll.mockResolvedValue([{ id: 3, nombre: "Hilux" }]);
    combustibleApi.getAll.mockResolvedValue([{ id: 4, nombre: "Diésel" }]);
    tipoRuedaApi.getAll.mockResolvedValue([{ id: 5, nombre: "Simple" }]);
    vehiculoApi.getById.mockResolvedValue(EXISTING_VEHICULO);
    vehiculoApi.update.mockResolvedValue({ id: 7 });
  });

  it("loads the existing vehicle data into the form", async () => {
    renderWithProviders(
      <Route path="/vehiculos/:id/editar" component={EditarVehiculo} />,
      { route: "/vehiculos/7/editar" }
    );

    await waitFor(() => {
      expect(vehiculoApi.getById).toHaveBeenCalledWith("7");
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/patente/i)).toHaveValue("AB123CD");
    });
  });

  it("submits changes and calls vehiculoApi.update", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/vehiculos/:id/editar" component={EditarVehiculo} />,
      { route: "/vehiculos/7/editar" }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/patente/i)).toHaveValue("AB123CD");
    });

    const patenteInput = screen.getByLabelText(/patente/i);
    await user.clear(patenteInput);
    await user.type(patenteInput, "ZZ999ZZ");

    await user.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    await waitFor(() => {
      expect(vehiculoApi.update).toHaveBeenCalledTimes(1);
    });

    expect(vehiculoApi.update).toHaveBeenCalledWith(
      "7",
      expect.objectContaining({ patente: "ZZ999ZZ" })
    );
  });
});
