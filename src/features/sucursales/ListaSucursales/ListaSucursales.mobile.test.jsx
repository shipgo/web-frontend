import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: "",
}));

const mockGet = vi.fn();
vi.mock("@api/sucursal.api", () => ({
  sucursalApi: {
    get: (...args) => mockGet(...args),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import ListaSucursales from "./index";

describe("ListaSucursales en mobile", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({
      content: [
        {
          id: 1,
          nombre: "Sucursal Centro",
          prefijo: "+54",
          telefono: "1234567",
          puntoEntrega: {
            nombreCalle: "Av. Colón",
            numeroCalle: "1234",
            localidad: { nombre: "Córdoba Capital", provincia: { nombre: "Córdoba" } },
          },
        },
      ],
      totalElements: 1,
      totalPages: 1,
    });
  });

  it("muestra tarjetas con dirección, provincia y teléfono", async () => {
    renderWithProviders(<ListaSucursales />);

    expect(await screen.findByTestId("list-card")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText(/Av\. Colón 1234/)).toBeInTheDocument();
    expect(screen.getByText(/Córdoba$/)).toBeInTheDocument();
    expect(screen.getByText(/\+54 1234567/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("abre la hoja de filtros con los campos secundarios", async () => {
    renderWithProviders(<ListaSucursales />);
    await screen.findByTestId("list-card");

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument();
  });
});
