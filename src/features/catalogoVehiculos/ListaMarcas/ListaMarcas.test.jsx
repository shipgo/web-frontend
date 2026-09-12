import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockGet = vi.fn();

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

import ListaMarcas from "./index";

describe("ListaMarcas", () => {
  beforeEach(() => {
    mockGet.mockReset();
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
});
