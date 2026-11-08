import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: "",
}));

const { mockGet, mockGetAllMarcas } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockGetAllMarcas: vi.fn(),
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
    getAll: vi.fn(),
    get: (...args) => mockGet(...args),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import ListaModelos from "./index";

describe("ListaModelos en mobile", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGetAllMarcas.mockReset();
    mockGetAllMarcas.mockResolvedValue([{ id: 1, nombre: "Mercedes-Benz" }]);
    mockGet.mockResolvedValue({
      content: [{ id: 1, nombre: "Sprinter", anio: 2021, marca: { id: 1, nombre: "Mercedes-Benz" } }],
      totalElements: 1,
      totalPages: 1,
    });
  });

  it("muestra una tarjeta con nombre, marca y año", async () => {
    renderWithProviders(<ListaModelos />);

    expect(await screen.findByTestId("list-card")).toBeInTheDocument();
    expect(screen.getByText("Sprinter")).toBeInTheDocument();
    expect(screen.getByText(/Mercedes-Benz/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("deja Marca y Año dentro de la hoja de filtros", async () => {
    renderWithProviders(<ListaModelos />);
    await screen.findByTestId("list-card");

    expect(screen.queryByLabelText("Año")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(await screen.findByLabelText("Año")).toBeInTheDocument();
  });
});
