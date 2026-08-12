import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ListaSucursales from "./index";

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

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ModalsProvider>{ui}</ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe("ListaSucursales", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders rows returned by sucursalApi.get", async () => {
    mockGet.mockResolvedValue({
      content: [
        {
          id: 1,
          nombre: "Sucursal Centro",
          email: "centro@shipgo.com",
          prefijo: "+54",
          telefono: "1234567",
          puntoEntrega: {
            id: 10,
            nombreCalle: "Av. Colón",
            numeroCalle: "1234",
            localidad: {
              id: 5,
              nombre: "Córdoba Capital",
              provincia: { id: 2, nombre: "Córdoba" },
            },
          },
        },
      ],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaSucursales />);

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText(/Av\. Colón 1234/)).toBeInTheDocument();
    expect(screen.getByText("Córdoba")).toBeInTheDocument();

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
  });

  it("shows the empty state when there are no sucursales", async () => {
    mockGet.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaSucursales />);

    expect(
      await screen.findByText("Sin sucursales que mostrar")
    ).toBeInTheDocument();
  });
});
