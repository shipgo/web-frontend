import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockGet = vi.fn();
const mockGetAllMarcas = vi.fn();

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

import ListaModelos from "./index";

describe("ListaModelos", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGetAllMarcas.mockReset();
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
});
