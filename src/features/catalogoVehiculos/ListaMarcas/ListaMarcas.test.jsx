import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockGet, mockToCsv } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockToCsv: vi.fn(),
}));

vi.mock("@api/vehiculo.api", () => ({
  marcaApi: {
    get: (...args) => mockGet(...args),
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  modeloApi: {
    getAll: vi.fn(),
    get: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@utils/csv", () => ({
  toCsv: mockToCsv,
  buildCsv: vi.fn(),
  downloadBlob: vi.fn(),
  escapeCsvValue: vi.fn(),
  CSV_MAX_ROWS: 5000,
  csvFilename: vi.fn((entidad) => `${entidad}_2026-09-26.csv`),
}));

import { renderWithProviders } from "../../../test/renderWithProviders";
import ListaMarcas from "./index";

describe("ListaMarcas", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockToCsv.mockReset();
  });

  it("renders rows returned by marcaApi.get", async () => {
    mockGet.mockResolvedValue({
      content: [{ id: 1, nombre: "Mercedes-Benz" }],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaMarcas />);

    expect(await screen.findByText("Mercedes-Benz")).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
  });

  it("shows the empty state when there are no marcas", async () => {
    mockGet.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaMarcas />);

    expect(await screen.findByText("Sin marcas que mostrar")).toBeInTheDocument();
  });

  it("shows both tabs, with Marcas active", async () => {
    mockGet.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaMarcas />);

    expect(await screen.findByRole("tab", { name: "Marcas" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Modelos" })).toBeInTheDocument();
  });

  it("exports to CSV with MARCAS_CSV_COLUMNS when clicking Exportar CSV", async () => {
    const user = userEvent.setup();
    const mockData = [
      { id: 1, nombre: "Mercedes-Benz" },
      { id: 2, nombre: "Volvo" },
    ];

    mockGet.mockResolvedValue({
      content: mockData,
      totalElements: 2,
      totalPages: 1,
    });

    renderWithProviders(<ListaMarcas />);

    const exportButton = await screen.findByRole("button", { name: /exportar csv/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockToCsv).toHaveBeenCalledWith(
        mockData,
        expect.arrayContaining([
          expect.objectContaining({ header: "Nombre" }),
        ]),
        expect.stringContaining("marcas_")
      );
    });
  });

  it("respeta los filtros aplicados al exportar CSV", async () => {
    const user = userEvent.setup();
    const filteredData = [{ id: 1, nombre: "Mercedes-Benz" }];

    // Primera llamada para cargar la lista
    mockGet.mockResolvedValueOnce({
      content: filteredData,
      totalElements: 1,
      totalPages: 1,
    });

    // Segunda llamada para la exportación (con el filtro)
    mockGet.mockResolvedValueOnce({
      content: filteredData,
      totalElements: 1,
      totalPages: 0,
    });

    renderWithProviders(<ListaMarcas />);

    // Esperar a que cargue la página
    await screen.findByText("Mercedes-Benz");

    // Aplicar un filtro digitando en el campo de búsqueda
    const searchInput = screen.getByPlaceholderText("Ej: Mercedes-Benz");
    await user.type(searchInput, "Mercedes");

    // Esperar a que se aplique el filtro (debounce)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Mercedes",
        })
      );
    }, { timeout: 2000 });

    // Resetear los mocks para los que vienen
    mockGet.mockClear();
    mockGet.mockResolvedValue({
      content: filteredData,
      totalElements: 1,
      totalPages: 0,
    });

    // Hacer clic en Exportar CSV
    const exportButton = screen.getByRole("button", { name: /exportar csv/i });
    await user.click(exportButton);

    // Verificar que marcaApi.get fue llamado con el filtro "nombre"
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Mercedes",
          page: 0,
          size: 5000,
        })
      );
    });
  });
});
