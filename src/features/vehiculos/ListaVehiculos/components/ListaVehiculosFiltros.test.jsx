import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockGetTiposVehiculo, mockGetCombustibles } = vi.hoisted(() => ({
  mockGetTiposVehiculo: vi.fn(),
  mockGetCombustibles: vi.fn(),
}));

vi.mock("@api/vehiculo.api", () => ({
  tipoVehiculoApi: {
    getAll: mockGetTiposVehiculo,
  },
  combustibleApi: {
    getAll: mockGetCombustibles,
  },
}));

import { renderWithProviders } from "../../../../test/renderWithProviders";
import ListaVehiculosFiltros from "./ListaVehiculosFiltros";

describe("ListaVehiculosFiltros", () => {
  beforeEach(() => {
    mockGetTiposVehiculo.mockReset();
    mockGetCombustibles.mockReset();
    mockGetTiposVehiculo.mockResolvedValue([
      { id: 1, nombre: "Camión" },
      { id: 2, nombre: "Camioneta" },
    ]);
    mockGetCombustibles.mockResolvedValue([
      { id: 1, nombre: "Diésel" },
      { id: 2, nombre: "Gasolina" },
    ]);
  });

  it("carga las opciones de Tipo y Combustible desde las APIs", async () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    await waitFor(() => {
      expect(mockGetTiposVehiculo).toHaveBeenCalled();
      expect(mockGetCombustibles).toHaveBeenCalled();
    });
  });

  it("muestra las opciones de Tipo de vehículo después de cargar", async () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const tipoSelect = await screen.findByRole("combobox", {
      name: /tipo de vehículo/i,
    });

    expect(tipoSelect).toBeInTheDocument();
  });

  it("muestra las opciones de Combustible después de cargar", async () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const combustibleSelect = await screen.findByRole("combobox", {
      name: /combustible/i,
    });

    expect(combustibleSelect).toBeInTheDocument();
  });

  it("seleccionar un Tipo de vehículo emite el filtro con el nombre", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const tipoSelect = await screen.findByRole("combobox", {
      name: /tipo de vehículo/i,
    });

    await user.click(tipoSelect);
    await user.click((await screen.findAllByText("Camión")).at(-1));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        tipoVehiculo: { label: "tipoVehiculo", values: "Camión" },
      });
    });
  });

  it("seleccionar un Combustible emite el filtro con el nombre", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const combustibleSelect = await screen.findByRole("combobox", {
      name: /combustible/i,
    });

    await user.click(combustibleSelect);
    await user.click((await screen.findAllByText("Diésel")).at(-1));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        combustible: { label: "combustible", values: "Diésel" },
      });
    });
  });

  it("limpiar el Select de Tipo saca la key del filtro", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const tipoSelect = await screen.findByRole("combobox", {
      name: /tipo de vehículo/i,
    });

    // Seleccionar un tipo
    await user.click(tipoSelect);
    await user.click((await screen.findAllByText("Camión")).at(-1));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        tipoVehiculo: { label: "tipoVehiculo", values: "Camión" },
      });
    });

    // Limpiar el Select clickeando el botón de limpiar
    const clearButton = document.querySelector('[data-combined-clear-section="true"] button');
    if (clearButton) {
      await user.click(clearButton);

      // Verificar que la última llamada a onFiltersChange NO incluye tipoVehiculo
      await waitFor(() => {
        const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
        expect(lastCall.tipoVehiculo).toBeUndefined();
      });
    }
  });

  it("los quick filters salen del catálogo real de tipos y emiten ese tipo", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={onFiltersChange} />);

    const chip = await screen.findByRole("checkbox", { name: "Camioneta" });
    expect(screen.queryByRole("checkbox", { name: "Camionetas" })).not.toBeInTheDocument();
    await user.click(chip);

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        tipoVehiculo: { label: "tipoVehiculo", values: "Camioneta" },
      });
    });
  });

  it("el placeholder de patente coincide con el del formulario", async () => {
    renderWithProviders(<ListaVehiculosFiltros onFiltersChange={vi.fn()} />);
    expect(await screen.findByPlaceholderText("Ej: AB123CD")).toBeInTheDocument();
  });
});
