import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockGet, mockGetAllMarcas, mockToCsv } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockGetAllMarcas: vi.fn(),
  mockToCsv: vi.fn(),
}));

vi.mock("@api/vehiculo.api", () => ({
  marcaApi: {
    get: vi.fn(),
    getAll: (...args) => mockGetAllMarcas(...args),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  modeloApi: {
    get: (...args) => mockGet(...args),
    getAll: vi.fn(),
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
import ListaModelos from "./index";

describe("ListaModelos", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGetAllMarcas.mockReset();
    mockToCsv.mockReset();
    mockGetAllMarcas.mockResolvedValue([{ id: 1, nombre: "Mercedes-Benz" }]);
  });

  it("renders rows returned by modeloApi.get, incluyendo marca y año", async () => {
    mockGet.mockResolvedValue({
      content: [
        {
          id: 1,
          nombre: "Sprinter",
          anio: 2020,
          marca: { id: 1, nombre: "Mercedes-Benz" },
        },
      ],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaModelos />);

    expect(await screen.findByText("Sprinter")).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(within(table).getByText("Mercedes-Benz")).toBeInTheDocument();
    expect(within(table).getByText("2020")).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
  });

  it("shows the empty state when there are no modelos", async () => {
    mockGet.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaModelos />);

    expect(await screen.findByText("Sin modelos que mostrar")).toBeInTheDocument();
  });

  it("exports to CSV with MODELOS_CSV_COLUMNS when clicking Exportar CSV", async () => {
    const user = userEvent.setup();
    const mockData = [
      {
        id: 1,
        nombre: "Sprinter",
        anio: 2020,
        marca: { id: 1, nombre: "Mercedes-Benz" },
      },
      {
        id: 2,
        nombre: "Actros",
        anio: 2021,
        marca: { id: 1, nombre: "Mercedes-Benz" },
      },
    ];

    mockGet.mockResolvedValue({
      content: mockData,
      totalElements: 2,
      totalPages: 1,
    });

    renderWithProviders(<ListaModelos />);

    const exportButton = await screen.findByRole("button", { name: /exportar csv/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockToCsv).toHaveBeenCalledWith(
        mockData,
        expect.arrayContaining([
          expect.objectContaining({ header: "Nombre" }),
          expect.objectContaining({ header: "Marca" }),
          expect.objectContaining({ header: "Año" }),
        ]),
        expect.stringContaining("modelos_")
      );
    });
  });
});
