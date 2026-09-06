import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";
import { describe, expect, it, vi, beforeEach } from "vitest";

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
import CrearVehiculo from "./index";

// Mantine keeps every Select's option list mounted in the DOM (hidden via
// CSS) even when its dropdown is closed, so `findByRole("option", ...)`
// against the whole document can match a closed select's options too. We
// scope the lookup to the listbox the just-opened combobox controls.
const selectOption = async (user, comboboxName, optionName) => {
  const combobox = screen.getByRole("combobox", { name: comboboxName });
  await user.click(combobox);
  const listboxId = combobox.getAttribute("aria-controls");
  const listbox = document.getElementById(listboxId);
  const option = await within(listbox).findByText(optionName);
  await user.click(option);
};

describe("CrearVehiculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    tipoVehiculoApi.getAll.mockResolvedValue([{ id: 1, nombre: "Camión" }]);
    marcaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Toyota" }]);
    modeloApi.getAll.mockResolvedValue([{ id: 3, nombre: "Hilux" }]);
    combustibleApi.getAll.mockResolvedValue([{ id: 4, nombre: "Diésel" }]);
    tipoRuedaApi.getAll.mockResolvedValue([{ id: 5, nombre: "Simple" }]);
    vehiculoApi.save.mockResolvedValue({ id: 99 });
  });

  it("submits the form and calls vehiculoApi.save with the expected payload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearVehiculo />);

    await waitFor(() => {
      expect(tipoVehiculoApi.getAll).toHaveBeenCalled();
    });

    await user.type(screen.getByRole("textbox", { name: /patente/i }), "AB123CD");

    await selectOption(user, /tipo de vehículo/i, "Camión");
    await selectOption(user, /^marca/i, "Toyota");

    await waitFor(() => {
      expect(modeloApi.getAll).toHaveBeenCalledWith({ marcaId: "2" });
    });

    await selectOption(user, /^modelo/i, "Hilux");
    await selectOption(user, /combustible/i, "Diésel");
    await selectOption(user, /tipo de rueda/i, "Simple");

    const pesoInput = screen.getByLabelText(/peso máximo/i);
    await user.clear(pesoInput);
    await user.type(pesoInput, "1500");

    const consumoInput = screen.getByLabelText(/consumo promedio/i);
    await user.clear(consumoInput);
    await user.type(consumoInput, "8.5");

    await user.click(
      screen.getByRole("button", { name: /crear vehículo/i })
    );

    await waitFor(() => {
      expect(vehiculoApi.save).toHaveBeenCalledTimes(1);
    });

    expect(vehiculoApi.save).toHaveBeenCalledWith(
      expect.objectContaining({
        patente: "AB123CD",
        tipoVehiculoID: 1,
        modeloID: 3,
        combustibleID: 4,
        tipoRuedaID: 5,
        pesoMaximo: 1500,
        consumoPromedio: 8.5,
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/vehículo creado/i)).toBeInTheDocument();
    });
  });
});
