import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/renderWithProviders";

const mockUseMisEnvios = vi.fn();
vi.mock("./hooks/useMisEnvios", () => ({
  PORTAL_ENVIOS_PAGE_SIZE: 10,
  useMisEnvios: () => mockUseMisEnvios(),
}));

vi.mock("wouter", async (importOriginal) => ({
  ...(await importOriginal()),
  useLocation: () => ["/portal/envios", vi.fn()],
}));

import PortalEnviosPage from "./index";

const base = {
  envios: [],
  totalPages: 0,
  totalElements: 0,
  isLoading: false,
  isError: false,
  isFetching: false,
};

describe("PortalEnviosPage", () => {
  beforeEach(() => mockUseMisEnvios.mockReset());

  it("muestra el estado vacío", () => {
    mockUseMisEnvios.mockReturnValue({ ...base });
    renderWithProviders(<PortalEnviosPage />);
    expect(screen.getByText("Todavía no tenés envíos")).toBeInTheDocument();
  });

  it("muestra el estado de error", () => {
    mockUseMisEnvios.mockReturnValue({ ...base, isError: true });
    renderWithProviders(<PortalEnviosPage />);
    expect(
      screen.getByText("No pudimos cargar tus envíos"),
    ).toBeInTheDocument();
  });

  it("renderiza una fila por envío con código, estado y destino", () => {
    mockUseMisEnvios.mockReturnValue({
      ...base,
      totalElements: 1,
      envios: [
        {
          id: 1,
          codigoSeguimiento: "SEED000001",
          estado: "en_camino",
          historialEstado: [
            { estado: "creado", fechaHoraInicio: "2026-01-01T09:00:00" },
          ],
          destino: {
            localidad: { nombre: "Córdoba", provincia: { nombre: "Córdoba" } },
          },
        },
      ],
    });
    renderWithProviders(<PortalEnviosPage />);

    expect(screen.getByText("SEED000001")).toBeInTheDocument();
    expect(screen.getByText("En camino")).toBeInTheDocument();
    expect(screen.getByText("Córdoba, Córdoba")).toBeInTheDocument();
  });
});
